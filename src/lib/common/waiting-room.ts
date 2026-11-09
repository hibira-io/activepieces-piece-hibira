import { Property } from '@activepieces/pieces-framework';

export const roomProp = Property.ShortText({
  displayName: 'Room',
  description: "The waiting room's name: 1 to 64 letters, digits, '-' or '_', such as presale.",
  required: true,
});

/** The path of a room in the signed waiting room API. */
export function roomPath(room: string, action = ''): string {
  return `/waiting_rooms/${encodeURIComponent(room.trim())}${action}`;
}

export type WaitingRoom = {
  room: string;
  title?: string;
  state: 'open' | 'paused' | 'closed';
  admitted: number;
  issued: number;
  waiting: number;
  admit_per_minute: number;
  starts_at?: string;
  channel: string;
  burst: number;
  pass_ttl_seconds: number;
  return_urls: string[];
  [key: string]: unknown;
};
