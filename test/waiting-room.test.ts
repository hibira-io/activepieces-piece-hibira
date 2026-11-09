/// <reference types="vitest/globals" />

import { createHash, createHmac } from 'node:crypto';
import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../src/index';
import { admitWaitingRoom } from '../src/lib/actions/admit-waiting-room';
import { deleteWaitingRoom } from '../src/lib/actions/delete-waiting-room';
import { getWaitingRoom } from '../src/lib/actions/get-waiting-room';
import { updateWaitingRoom } from '../src/lib/actions/update-waiting-room';
import { verifyWaitingRoomPass } from '../src/lib/actions/verify-waiting-room-pass';

const props = { appId: '42', key: 'app-key', secret: 'app-secret', baseUrl: 'https://ws.hibira.io' };
const auth = { type: 'CUSTOM_AUTH', props };
const ctx = (propsValue: Record<string, unknown>) => ({ ...createMockActionContext({ propsValue }), auth }) as never;

type Sent = { method: string; url: string; body?: string; queryParams: Record<string, string> };

function signed(req: Sent): boolean {
  const path = new URL(req.url).pathname;
  const q = Object.entries(req.queryParams)
    .filter(([k]) => k !== 'auth_signature')
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const ok = createHmac('sha256', props.secret).update(`${req.method}\n${path}\n${q}`).digest('hex') === req.queryParams['auth_signature'];
  return ok && (req.body === undefined || req.queryParams['body_md5'] === createHash('md5').update(req.body).digest('hex'));
}

beforeEach(() => sendRequest.mockReset().mockResolvedValue({ body: { room: 'presale', state: 'open' } }));

test('Get Waiting Room reads the room', async () => {
  const out = await getWaitingRoom.run(ctx({ room: ' presale ' }));
  const req: Sent = sendRequest.mock.calls[0][0];
  expect(req.method).toBe('GET');
  expect(req.url).toBe('https://ws.hibira.io/apps/42/waiting_rooms/presale');
  expect(signed(req)).toBe(true);
  expect(out).toEqual({ room: 'presale', state: 'open' });
});

test('Create or Update Waiting Room sends only the fields given', async () => {
  await updateWaitingRoom.run(
    ctx({ room: 'presale', admitPerMinute: 200, state: 'paused', startsAt: '2026-12-04T12:00:00+09:00', returnUrls: 'https://a.example\nhttps://b.example' }),
  );
  await updateWaitingRoom.run(ctx({ room: 'presale', state: 'open' }));
  const [create, update]: Sent[] = sendRequest.mock.calls.map((c) => c[0]);
  expect(create.method).toBe('POST');
  expect(create.url).toBe('https://ws.hibira.io/apps/42/waiting_rooms/presale');
  expect(JSON.parse(create.body!)).toEqual({
    admit_per_minute: 200,
    state: 'paused',
    starts_at: '2026-12-04T03:00:00Z',
    return_urls: ['https://a.example', 'https://b.example'],
  });
  expect(JSON.parse(update.body!)).toEqual({ state: 'open' });
  expect(signed(create) && signed(update)).toBe(true);
});

test('Admit Visitors and Delete Waiting Room', async () => {
  await admitWaitingRoom.run(ctx({ room: 'presale', count: 50 }));
  sendRequest.mockResolvedValueOnce({ body: { deleted: true } });
  const deleted = await deleteWaitingRoom.run(ctx({ room: 'presale' }));
  const [admit, del]: Sent[] = sendRequest.mock.calls.map((c) => c[0]);
  expect(admit.url).toBe('https://ws.hibira.io/apps/42/waiting_rooms/presale/admit');
  expect(JSON.parse(admit.body!)).toEqual({ count: 50 });
  expect(del.method).toBe('DELETE');
  expect(signed(admit) && signed(del)).toBe(true);
  expect(deleted).toEqual({ room: 'presale', deleted: true });
});

test('Verify Waiting Room Pass returns the claims', async () => {
  sendRequest.mockResolvedValueOnce({ body: { valid: true, number: 42, ticket_id: 'd79fe789a38b8631b5', expires_at: '2027-01-15T08:30:00Z' } });
  const out = await verifyWaitingRoomPass.run(ctx({ room: 'presale', pass: ' abc.def ' }));
  const req: Sent = sendRequest.mock.calls[0][0];
  expect(req.url).toBe('https://ws.hibira.io/apps/42/waiting_rooms/presale/verify');
  expect(JSON.parse(req.body!)).toEqual({ pass: 'abc.def' });
  expect(signed(req)).toBe(true);
  expect(out).toEqual({ room: 'presale', valid: true, number: 42, ticket_id: 'd79fe789a38b8631b5', expires_at: '2027-01-15T08:30:00Z' });
});
