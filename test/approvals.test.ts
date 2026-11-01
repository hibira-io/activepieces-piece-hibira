/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../src/index';
import { requestApproval } from '../src/lib/actions/request-approval';
import { getApproval } from '../src/lib/actions/get-approval';

const props = { appId: '42', key: 'app-key', secret: 'app-secret', baseUrl: 'https://ws.hibira.io' };
const auth = { type: 'CUSTOM_AUTH', props };
const ctx = (propsValue: Record<string, unknown>) => ({ ...createMockActionContext({ propsValue }), auth }) as never;

beforeEach(() => sendRequest.mockReset());

test('Request Approval posts the request and waits for the answer', async () => {
  sendRequest
    .mockResolvedValueOnce({ body: { approval_id: 'apr_1', status: 'pending', url: 'https://hibira.io/approve/apr_1/t' } })
    .mockResolvedValueOnce({ body: { approval_id: 'apr_1', status: 'pending' } })
    .mockResolvedValueOnce({ body: { approval_id: 'apr_1', status: 'approved', choice: 'Ship' } });
  const out = await requestApproval.run(
    ctx({ title: 'Ship it?', options: 'Ship, Hold', pushInterests: 'ops', waitForAnswer: true, maxWaitMinutes: 2 }),
  );
  expect(out).toEqual({ approval_id: 'apr_1', status: 'approved', choice: 'Ship', url: 'https://hibira.io/approve/apr_1/t' });
  const [create, poll] = sendRequest.mock.calls.map((c) => c[0]);
  expect(create.method).toBe('POST');
  expect(create.url).toBe('https://ws.hibira.io/apps/42/approvals');
  expect(JSON.parse(create.body)).toEqual({ title: 'Ship it?', agent: 'Activepieces', options: ['Ship', 'Hold'], push_interests: ['ops'] });
  expect(create.queryParams.body_md5).toBeDefined();
  expect(poll.url).toBe('https://ws.hibira.io/apps/42/approvals/apr_1');
  expect(poll.queryParams.wait).toBe('25');
  expect(poll.queryParams.auth_signature).toBeDefined();
});

test('Request Approval without waiting returns the link at once', async () => {
  sendRequest.mockResolvedValueOnce({ body: { approval_id: 'apr_2', status: 'pending', url: 'u' } });
  const out = await requestApproval.run(ctx({ title: 'x', options: '', waitForAnswer: false }));
  expect(out).toEqual({ approval_id: 'apr_2', status: 'pending', url: 'u' });
  expect(JSON.parse(sendRequest.mock.calls[0][0].body)).toEqual({ title: 'x', agent: 'Activepieces' });
});

test('Get Approval with no wait reads the status once', async () => {
  sendRequest.mockResolvedValueOnce({ body: { approval_id: 'apr_3', status: 'pending' } });
  const out = await getApproval.run(ctx({ approvalId: ' apr_3 ', maxWaitMinutes: 0 }));
  expect(out).toEqual({ approval_id: 'apr_3', status: 'pending' });
  expect(sendRequest).toHaveBeenCalledTimes(1);
});
