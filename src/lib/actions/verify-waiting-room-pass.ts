import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';
import { roomPath, roomProp } from '../common/waiting-room';

type Verified = { valid: boolean; number?: number; ticket_id?: string; expires_at?: string };

export const verifyWaitingRoomPass = createAction({
  auth: hibiraAuth,
  name: 'verify_waiting_room_pass',
  displayName: 'Verify Waiting Room Pass',
  description: 'Checks a pass a visitor brought back from the waiting room. Record ticket_id to allow one checkout per place in line.',
  props: {
    room: roomProp,
    pass: Property.ShortText({
      displayName: 'Pass',
      description: 'The hibira_pass query parameter, or the hibira_wr_<room> cookie value.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await hibiraClient.channels<Verified>(auth, {
      method: 'POST',
      path: roomPath(propsValue.room, '/verify'),
      body: { pass: propsValue.pass.trim() },
    });
    return { room: propsValue.room.trim(), ...result };
  },
});
