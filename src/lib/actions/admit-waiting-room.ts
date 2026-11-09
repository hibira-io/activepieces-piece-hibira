import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';
import { roomPath, roomProp, WaitingRoom } from '../common/waiting-room';

export const admitWaitingRoom = createAction({
  auth: hibiraAuth,
  name: 'admit_waiting_room',
  displayName: 'Admit Visitors',
  description: 'Lets the next visitors in a waiting room through now, on top of the steady rate.',
  props: {
    room: roomProp,
    count: Property.Number({
      displayName: 'Visitors',
      description: 'How many of the next visitors to admit.',
      required: true,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    return hibiraClient.channels<WaitingRoom>(auth, {
      method: 'POST',
      path: roomPath(propsValue.room, '/admit'),
      body: { count: propsValue.count },
    });
  },
});
