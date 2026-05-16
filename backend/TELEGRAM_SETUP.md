# Telegram Bot Integration

Telegram is implemented as an external interface layer. It does not duplicate AI Workspace business logic; it calls the existing services for AI chat, tasks, document search, memory, Gmail, and coding help.

## Files Added

- `src/interfaces/telegram/telegram.routes.js`
- `src/interfaces/telegram/telegram.controller.js`
- `src/interfaces/telegram/telegram.service.js`
- `src/interfaces/telegram/telegram.parser.js`
- `src/interfaces/telegram/telegram.middleware.js`
- `src/models/TelegramLink.js`

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=123456:bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=use_a_long_random_secret
TELEGRAM_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/telegram/webhook
TELEGRAM_LINK_CODE_TTL_MINUTES=10
TELEGRAM_RATE_LIMIT_WINDOW_MS=60000
TELEGRAM_RATE_LIMIT_MAX=20
```

## API Routes

Webhook route:

```http
POST /api/telegram/webhook
```

Authenticated web app routes:

```http
POST /api/telegram/link-code
GET /api/telegram/status
DELETE /api/telegram/unlink
POST /api/telegram/setup-webhook
```

## Setup With Ngrok

1. Start backend:

```powershell
cd backend
npm run dev
```

2. Start ngrok:

```powershell
ngrok http 5000
```

3. Copy the HTTPS ngrok URL into `.env`:

```env
TELEGRAM_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/telegram/webhook
```

4. Restart backend after changing `.env`.

5. Log in to the web app and either click **Set Webhook** in Settings, or call:

```http
POST http://localhost:5000/api/telegram/setup-webhook
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## User Linking Flow

1. Log in to the AI Workspace web app.
2. Open Settings and click **Generate Link Code**, or call:

```http
POST /api/telegram/link-code
Authorization: Bearer YOUR_ACCESS_TOKEN
```

3. Send the returned code to the bot:

```text
/link ABC123
```

Telegram messages are now mapped to the existing app user through `TelegramLink`.

## Commands

```text
/start
/help
/tasks
/task title: DBMS revision deadline: 2026-05-15 priority: high
/remind title: Submit report deadline: 2026-05-20
/search TCP congestion control
/ask Summarize my uploaded DBMS notes
/code debug this C program...
/memory DBMS exam
/mail to: person@email.com subject: Hello body: Message text
```

Natural examples also work:

```text
create task revise normalization tomorrow
list my tasks
search operating system scheduling notes
debug this JavaScript error
```

## Security Notes

- Telegram webhook requests must include `X-Telegram-Bot-Api-Secret-Token`.
- Webhook traffic is rate-limited per Telegram chat.
- Commands that access workspace data require a linked Telegram account.
- Gmail sending reuses the existing Google integration, so the user must already have Gmail connected.

## Streaming

Telegram webhooks are request/response based, so true token streaming is not as clean as Socket.IO in the web app. The bot sends a typing indicator immediately, then returns the final answer. Long answers are split into Telegram-safe message chunks.
