# Hibira piece for Activepieces

[Hibira](https://hibira.io) is a hosted realtime service that speaks the Pusher Channels and Beams protocols: WebSocket channels, presence and push notifications. This package adds Hibira to [Activepieces](https://www.activepieces.com) as a custom piece.

## Install

On a self-hosted Activepieces, open the admin settings, go to **Pieces** and choose **Install Piece**. Pick npm as the source and enter:

```
@hibira-io/piece-hibira
```

Leave the version empty for the latest release, or pin one such as `0.1.0`. The piece then shows up as **Hibira** in the flow builder.

## Connection

You need an app on [hibira.io](https://hibira.io/portal). The free plan is enough and needs no card.

- **App ID**, **Key** and **Secret**: from the app page.
- **API URL**: leave the default (`https://ws.hibira.io`) unless your app runs in another cluster.
- **Push instance ID** and **Push secret key**: from the app's Push tab, only for the push notification actions.

The connection is checked with a signed request when you save it.

## Actions

- **Send Event**: publish an event to up to 100 channels.
- **List Occupied Channels**, **Get Channel**, **Get Users in Presence Channel** (pages through `presence-large-` channels).
- **Disconnect User**: close every connection of a signed-in user.
- **Send Push Notification to Interests**, **Send Push Notification to Users**, **Delete Push User**.

## Trigger

- **New Channel Event**: channel occupied or vacated, presence member added or removed, client events, subscription count, cache miss and chat message. The trigger registers its own webhook on the app when the flow is turned on, removes it when the flow is turned off, and checks the signature of every call with the app secret (including the previous secret during a rotation).

## Develop

```sh
npm install
npm run typecheck
npm test
npm run build
```

Releases are published to npm by the `publish` workflow when a GitHub release is created.

## License

MIT
