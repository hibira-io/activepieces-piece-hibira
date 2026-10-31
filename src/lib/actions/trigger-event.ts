import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient, splitList } from '../common/client';

export const triggerEvent = createAction({
  auth: hibiraAuth,
  name: 'trigger_event',
  displayName: 'Send Event',
  description: 'Sends a realtime event to everyone subscribed to one or more channels.',
  props: {
    channels: Property.ShortText({
      displayName: 'Channels',
      description: 'One channel, or several separated by commas (up to 100).',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Data',
      description: 'The event payload, sent as JSON.',
      required: true,
      defaultValue: { message: 'Hello from Activepieces' },
    }),
    socketId: Property.ShortText({
      displayName: 'Exclude Socket ID',
      description: 'A connection that should not receive the event, usually the sender.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const channels = splitList(propsValue.channels);
    if (channels.length === 0) {
      throw new Error('Enter at least one channel.');
    }
    const body: Record<string, unknown> = {
      name: propsValue.eventName,
      channels,
      data: typeof propsValue.data === 'string' ? propsValue.data : JSON.stringify(propsValue.data),
    };
    if (propsValue.socketId) {
      body['socket_id'] = propsValue.socketId;
    }
    const response = await hibiraClient.channels<{ channels?: Record<string, unknown> }>(auth, {
      method: 'POST',
      path: '/events',
      body,
    });
    // The API answers with per-channel info, keyed by channel name.
    return { channels, channel_info: response?.channels ?? {} };
  },
});
