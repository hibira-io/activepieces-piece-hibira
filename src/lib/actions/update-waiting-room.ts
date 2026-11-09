import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient, splitList } from '../common/client';
import { roomPath, roomProp, WaitingRoom } from '../common/waiting-room';

export const updateWaitingRoom = createAction({
  auth: hibiraAuth,
  name: 'update_waiting_room',
  displayName: 'Create or Update Waiting Room',
  description: 'Creates a waiting room, or changes its state, admission rate, start time or other settings.',
  props: {
    room: roomProp,
    admitPerMinute: Property.Number({
      displayName: 'Admit per Minute',
      description: 'How many visitors to let through each minute. Required when the room is new; leave empty to keep the current rate.',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Leave empty to keep the current state. A new room opens.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Paused (visitors can join, nobody is admitted)', value: 'paused' },
          { label: 'Closed (nobody can join)', value: 'closed' },
        ],
      },
    }),
    startsAt: Property.DateTime({
      displayName: 'Starts At',
      description: 'When admission starts. Visitors can join the queue before then.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Shown on the waiting page, at most 120 characters.',
      required: false,
    }),
    burst: Property.Number({
      displayName: 'Burst',
      description: 'How many visitors may be admitted at once when the queue starts moving.',
      required: false,
    }),
    passTtlSeconds: Property.Number({
      displayName: 'Pass Lifetime (Seconds)',
      description: 'How long an admitted visitor stays in: 60 to 86400. Default 1800.',
      required: false,
    }),
    returnUrls: Property.LongText({
      displayName: 'Return URLs',
      description: 'Comma or newline separated https addresses visitors may be sent back to (http only for localhost). Up to 10.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const body: Record<string, unknown> = {};
    if (p.admitPerMinute) body['admit_per_minute'] = p.admitPerMinute;
    if (p.state) body['state'] = p.state;
    if (p.startsAt) body['starts_at'] = new Date(p.startsAt).toISOString().replace(/\.\d{3}Z$/, 'Z');
    if (p.title) body['title'] = p.title;
    if (p.burst) body['burst'] = p.burst;
    if (p.passTtlSeconds) body['pass_ttl_seconds'] = p.passTtlSeconds;
    if (p.returnUrls) body['return_urls'] = splitList(p.returnUrls);
    return hibiraClient.channels<WaitingRoom>(auth, { method: 'POST', path: roomPath(p.room), body });
  },
});
