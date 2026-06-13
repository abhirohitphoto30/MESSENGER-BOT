# MESSENGER BOT

A Telegram bot that **broadcasts any message to all groups it is a member of**.
Supports text, photos, videos, GIFs, documents, audio, voice, stickers, and locations.

## How It Works

1. Add the bot to any Telegram groups (member, not necessarily admin)
2. Send any message to the bot in private chat
3. Bot forwards it to **every group it is in** automatically
4. Groups are auto-tracked — bot saves when it joins/leaves

## Setup (Step by Step)

### 1. Create a Telegram Bot
- Open [@BotFather](https://t.me/BotFather) → `/newbot`
- Copy the **Bot Token**
- Send `/setprivacy` to BotFather → select your bot → **Disable**

### 2. Get Your Telegram User ID
- Open [@userinfobot](https://t.me/userinfobot) and start it
- Copy your numeric **User ID**

### 3. Set Up Upstash Redis (Free)
- Go to [upstash.com](https://upstash.com) → Create free Redis database
- Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**

### 4. Deploy to Vercel
- [vercel.com](https://vercel.com) → New Project → Import this GitHub repo
- Add these **Environment Variables** in Vercel settings:

  | Variable | Value |
  |---|---|
  | `BOT_TOKEN` | Telegram bot token from BotFather |
  | `OWNER_ID` | Your Telegram numeric user ID |
  | `UPSTASH_REDIS_REST_URL` | From Upstash dashboard |
  | `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard |

- Click **Deploy** and copy your Vercel domain (e.g. `messenger-bot.vercel.app`)

### 5. Register the Webhook
Open this URL in your browser (replace the values):

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/webhook&allowed_updates=["message","my_chat_member"]
```

You should see: `{"ok":true,"result":true}`

### 6. Add Bot to Groups and Start!
- Add your bot to Telegram groups
- Open the bot in private chat → `/start`
- Send any message → it broadcasts to all groups instantly

## Commands

| Command | Description |
|---|---|
| `/start` | Show help message |
| `/groups` | List all tracked group IDs |
| `/count` | Total number of groups |

## Supported Message Types

- Text (with formatting, links, mentions)
- Photos
- Videos
- GIFs / Animations
- Documents and Files
- Audio
- Voice messages
- Stickers
- Video notes (circle videos)
- Locations

## Stack

- **Telegraf** — Telegram bot framework
- **Upstash Redis** — Serverless persistent storage for group IDs
- **Vercel** — Serverless webhook hosting

> **Security:** Only messages from the owner (matching OWNER_ID) are broadcasted. All others are silently ignored.