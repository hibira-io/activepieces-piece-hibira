import { hibiraClient, HibiraAuthProps } from './client';

export type Approval = {
  approval_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  url?: string;
  [key: string]: unknown;
};

/** Longest wait a step may hold a flow (Activepieces stops steps after 10 minutes). */
export const MAX_WAIT_MINUTES = 9;

/**
 * Long-polls an approval (25 s per request, no timers) until it is answered
 * or expires, or maxWaitMinutes runs out. Keeps the answer link of the
 * request in the result.
 */
export async function waitForApproval(
  auth: { props: HibiraAuthProps } | HibiraAuthProps,
  approval: Approval,
  maxWaitMinutes: number,
): Promise<Approval> {
  const minutes = Math.min(Math.max(maxWaitMinutes, 0), MAX_WAIT_MINUTES);
  const deadline = Date.now() + minutes * 60_000;
  let current = approval;
  while (current.status === 'pending') {
    const left = Math.floor((deadline - Date.now()) / 1000);
    if (left <= 0) break;
    const next = await hibiraClient.channels<Approval>(auth, {
      method: 'GET',
      path: `/approvals/${encodeURIComponent(approval.approval_id)}`,
      query: { wait: String(Math.min(25, left)) },
      timeout: 40_000,
    });
    current = approval.url === undefined ? next : { ...next, url: approval.url };
  }
  return current;
}
