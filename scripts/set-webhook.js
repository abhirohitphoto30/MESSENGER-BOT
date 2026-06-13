// Run this once after deploying to Vercel to register the webhook
// Usage: BOT_TOKEN=xxx VERCEL_DOMAIN=your-app.vercel.app node scripts/set-webhook.js

const token = process.env.BOT_TOKEN;
const domain = process.env.VERCEL_DOMAIN;

if (!token || !domain) {
  console.error('Missing BOT_TOKEN or VERCEL_DOMAIN env var');
  process.exit(1);
}

const webhookUrl = `https://${domain}/api/webhook`;

fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'my_chat_member'] }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log('Webhook set result:', data);
    if (data.ok) {
      console.log('SUCCESS! Webhook registered at:', webhookUrl);
    } else {
      console.error('FAILED:', data.description);
    }
  });