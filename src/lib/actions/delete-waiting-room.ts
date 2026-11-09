import { createAction } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';
import { roomPath, roomProp } from '../common/waiting-room';

export const deleteWaitingRoom = createAction({
  auth: hibiraAuth,
  name: 'delete_waiting_room',
  displayName: 'Delete Waiting Room',
  description: 'Deletes a waiting room and its queue.',
  props: {
    room: roomProp,
  },
  async run({ auth, propsValue }) {
    const result = await hibiraClient.channels<{ deleted: boolean }>(auth, { method: 'DELETE', path: roomPath(propsValue.room) });
    return { room: propsValue.room.trim(), ...result };
  },
});
