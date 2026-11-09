import { createAction } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';
import { roomPath, roomProp, WaitingRoom } from '../common/waiting-room';

export const getWaitingRoom = createAction({
  auth: hibiraAuth,
  name: 'get_waiting_room',
  displayName: 'Get Waiting Room',
  description: "Gets a waiting room's settings and how many visitors are waiting and admitted.",
  props: {
    room: roomProp,
  },
  async run({ auth, propsValue }) {
    return hibiraClient.channels<WaitingRoom>(auth, { method: 'GET', path: roomPath(propsValue.room) });
  },
});
