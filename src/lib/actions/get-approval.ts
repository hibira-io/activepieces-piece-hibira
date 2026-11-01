import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { Approval, MAX_WAIT_MINUTES, waitForApproval } from '../common/approvals';
import { hibiraClient } from '../common/client';

export const getApproval = createAction({
  auth: hibiraAuth,
  name: 'get_approval',
  displayName: 'Get Approval',
  description: 'Gets the status (pending, approved, rejected or expired) and answer of an approval request.',
  props: {
    approvalId: Property.ShortText({
      displayName: 'Approval ID',
      description: 'The approval_id returned by Request Approval (apr_...).',
      required: true,
    }),
    maxWaitMinutes: Property.Number({
      displayName: 'Wait (Minutes)',
      description: `Wait up to this long (0 to ${MAX_WAIT_MINUTES}) for a pending request to be answered. 0 returns at once.`,
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const current = await hibiraClient.channels<Approval>(auth, {
      method: 'GET',
      path: `/approvals/${encodeURIComponent(propsValue.approvalId.trim())}`,
    });
    return waitForApproval(auth, current, propsValue.maxWaitMinutes ?? 0);
  },
});
