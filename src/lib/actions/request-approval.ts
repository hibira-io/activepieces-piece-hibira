import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { Approval, MAX_WAIT_MINUTES, waitForApproval } from '../common/approvals';
import { hibiraClient, splitList } from '../common/client';

export const requestApproval = createAction({
  auth: hibiraAuth,
  name: 'request_approval',
  displayName: 'Request Approval',
  description:
    'Asks a person to approve or choose through a Hibira-hosted answer link, and can wait for the answer.',
  props: {
    title: Property.ShortText({
      displayName: 'Question',
      description: 'What needs a decision, as a short question (at most 200 characters), such as "Refund order #1042 for $89?".',
      required: true,
    }),
    options: Property.ShortText({
      displayName: 'Choices',
      description: '2 to 4 choices, separated by commas. The first one approves; any other rejects.',
      required: false,
      defaultValue: 'Approve, Reject',
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Context shown to the person: what will happen and why (at most 4000 characters).',
      required: false,
    }),
    waitForAnswer: Property.Checkbox({
      displayName: 'Wait for Answer',
      description: `Keep the flow at this step until the person answers, for up to ${MAX_WAIT_MINUTES} minutes. Otherwise the step returns the link at once; check later with Get Approval.`,
      required: false,
      defaultValue: true,
    }),
    maxWaitMinutes: Property.Number({
      displayName: 'Max Wait (Minutes)',
      description: `Stop waiting after this long (1 to ${MAX_WAIT_MINUTES}) and return the request as still pending.`,
      required: false,
      defaultValue: 5,
    }),
    expiresInMinutes: Property.Number({
      displayName: 'Expires In (Minutes)',
      description: 'How long the link can be answered (default 60, at most 10080 = 7 days).',
      required: false,
    }),
    channel: Property.ShortText({
      displayName: 'Channel',
      description: 'Channel to announce the request and its answer on, for the @hibira-io/approvals inbox components.',
      required: false,
    }),
    pushInterests: Property.ShortText({
      displayName: 'Push to Interests',
      description: 'Send the link as a push notification to these interests, separated by commas (the app needs Push enabled).',
      required: false,
    }),
    pushUsers: Property.ShortText({
      displayName: 'Push to User IDs',
      description: 'Send the link as a push notification to these user IDs instead of interests.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { title: propsValue.title, agent: 'Activepieces' };
    const options = splitList(propsValue.options);
    if (options.length > 0) body['options'] = options;
    if (propsValue.details) body['details'] = propsValue.details;
    if (propsValue.expiresInMinutes) body['expires_in_minutes'] = propsValue.expiresInMinutes;
    if (propsValue.channel) body['channel'] = propsValue.channel;
    const interests = splitList(propsValue.pushInterests);
    const users = splitList(propsValue.pushUsers);
    if (interests.length > 0) body['push_interests'] = interests;
    if (users.length > 0) body['push_users'] = users;
    const created = await hibiraClient.channels<Approval>(auth, { method: 'POST', path: '/approvals', body });
    if (propsValue.waitForAnswer === false) return created;
    return waitForApproval(auth, created, propsValue.maxWaitMinutes ?? 5);
  },
});
