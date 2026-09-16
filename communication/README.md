# integration.greycollar.ai

## WhatsApp channel (`whatsapp/`)

The WhatsApp channel follows the same shape as the other channels in this
service: an inbound adapter turns a channel event into a platform session, and
an `AI_ASSISTANT_MESSAGED` subscription pushes the agent's answer back out.

| File | Role |
| --- | --- |
| `whatsapp/webhook.ts` | Router mounted at `/whatsapp` — Meta verification handshake + inbound messages |
| `whatsapp/session.ts` | `AI_ASSISTANT_MESSAGED` / `ERROR_OCCURRED` subscriptions → outbound delivery |
| `whatsapp/store.ts` | `waId` ⇄ `sessionId` mapping in `Storage`, expiring with the 24-hour WhatsApp window |
| `whatsapp/send.ts` | Cloud API text send (`POST {graphUrl}/{version}/{phoneNumberId}/messages`) |
| `whatsapp/token.ts` | Service JWT (`aud` = projectId), same idea as `chat/webhook.ts` |
| `whatsapp/config.ts` | Environment values, read lazily |
| `api/getCommunications.ts` | `GET /communications` — used to resolve the blueprint |

### Inbound

```
POST   /whatsapp/:projectId                          WhatsApp Cloud API webhook payload
GET    /whatsapp/:projectId                          hub.mode / hub.verify_token / hub.challenge
DELETE /whatsapp/:projectId/conversations/:waId      forget the session of one number
       ?phoneNumberId=…                              (the mock's Refresh button)
```

For each text message in the payload:

1. `channelCode` (the `phone_number_id`, or the display number) is matched
   against the `WHATSAPP` records of `GET /communications` → `blueprintId`
   (`WHATSAPP_BLUEPRINT_ID` is the fallback when nothing is registered)
2. `GET /blueprints/{id}` → `agentId`
3. `POST /sessions` with `{type:"CHAT", agentId, blueprintId, variables}`,
   where the variables carry `{channel:"WHATSAPP", from, name, phoneNumberId}`
4. `POST /sessions/{id}` with the message text

The session is remembered per `projectId + phoneNumberId + waId`, so the
following messages from the same number continue in the same session instead of
starting a new one. `DELETE …/conversations/:waId` drops that mapping, so the
next message opens a new session — this is what the mock's Refresh button calls. Statuses (`delivered`, `read`) and non-text messages are
ignored, and the webhook always answers `200` — as Meta requires.

### Outbound

`whatsapp/session.ts` subscribes to `AI_ASSISTANT_MESSAGED`, looks the
conversation up by `sessionId` and sends the answer with the Cloud API text
shape. Unknown sessions (Slack, test chat) are skipped.

### Environment

| Variable | Meaning |
| --- | --- |
| `WHATSAPP_VERIFY_TOKEN` | Token expected by the `GET` verification handshake |
| `WHATSAPP_ACCESS_TOKEN` | Bearer token of the send call |
| `WHATSAPP_GRAPH_URL` | Send host — `https://graph.facebook.com` in production |
| `WHATSAPP_API_VERSION` | Graph version, default `v21.0` |
| `WHATSAPP_BLUEPRINT_ID` | Fallback blueprint when no `Communication` record matches |
| `WHATSAPP_SESSION_TTL_MS` | Session window, default 24 h |
| `WHATSAPP_TIMEOUT_MS` | Send timeout, default 10 s |

### Wiring it to the WhatsApp mock

The channel is developed against the **WhatsApp Business mock**
(`test-enterprise-systems/mocks/whatsapp`, port 5202), which speaks the same
Cloud API shapes in both directions — the mock is a drop-in for Meta:

```sh
WHATSAPP_GRAPH_URL=http://localhost:5202/api/whatsapp
WHATSAPP_ACCESS_TOKEN=mock-token
WHATSAPP_VERIFY_TOKEN=mock-verify
WHATSAPP_BLUEPRINT_ID=<blueprint uuid>   # or register a Communication record
```

The mock ships wired to the seed data's **Order and Compliance** blueprint
(`WHATSAPP_BLUEPRINT_ID` above, team `a829d2d6-8e52-41cd-ac10-0c92b21debcf`,
agent `order_management`), so its first chat — Corp Order Desk, phone number ID
`550100` — runs that blueprint end to end: find product → knowledge lookup →
assign certificate → create purchase order → send email.

In the mock's channel settings pick **Cloud API webhook**, set the
communication service URL to `http://localhost:3001` and the team ID to the
project id. A message typed on the mock phone then travels:

```
mock phone → POST /whatsapp/{projectId} → session → agent
           ← POST /{version}/{phoneNumberId}/messages ← AI_ASSISTANT_MESSAGED
```

The mock's per-chat **Phone number ID** is the `channelCode`; keep it identical
on both sides so the reply lands in the right chat.
