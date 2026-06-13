const { Telegraf } = require('telegraf');
const { Redis } = require('@upstash/redis');

const bot = new Telegraf(process.env.BOT_TOKEN);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const GROUPS_KEY = 'telegram:groups';
const OWNER_ID = parseInt(process.env.OWNER_ID);

// Track groups the bot joins or leaves
bot.on('my_chat_member', async (ctx) => {
  const chat = ctx.chat;
  const newStatus = ctx.myChatMember.new_chat_member.status;
  if (chat.type === 'group' || chat.type === 'supergroup') {
    if (newStatus === 'member' || newStatus === 'administrator') {
      await redis.sadd(GROUPS_KEY, String(chat.id));
      console.log('Joined group:', chat.id, chat.title);
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      await redis.srem(GROUPS_KEY, String(chat.id));
      console.log('Left group:', chat.id, chat.title);
    }
  }
});

// Commands - owner only
bot.command('start', async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;
  await ctx.reply(
    '\u{1F44B} Messenger Bot Active!\n\n' +
    'Send me any message and I will broadcast it to all groups I am in.\n' +
    'Supports: text, photo, video, GIF, document, sticker, voice, location\n\n' +
    '/groups - list tracked groups\n' +
    '/count - total group count'
  );
});

bot.command('groups', async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;
  const groups = await redis.smembers(GROUPS_KEY);
  if (!groups.length) return ctx.reply('No groups tracked yet. Add me to some groups!');
  await ctx.reply('Tracked groups (' + groups.length + '):\n' + groups.join('\n'));
});

bot.command('count', async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;
  const groups = await redis.smembers(GROUPS_KEY);
  await ctx.reply('Total groups: ' + groups.length);
});

// Broadcast helper
async function broadcast(ctx, sendFn) {
  if (ctx.from.id !== OWNER_ID) return;
  const groups = await redis.smembers(GROUPS_KEY);
  if (!groups.length) {
    return ctx.reply('No groups yet. Add me to groups first!');
  }
  let success = 0, failed = 0;
  for (const gid of groups) {
    try {
      await sendFn(gid);
      success++;
    } catch (err) {
      console.error('Send failed for', gid, err.message);
      if (err.message.includes('kicked') || err.message.includes('chat not found')) {
        await redis.srem(GROUPS_KEY, gid);
      }
      failed++;
    }
  }
  await ctx.reply('Broadcast done! Sent: ' + success + ', Failed: ' + failed);
}

// Text
bot.on('text', (ctx) =>
  broadcast(ctx, (gid) => ctx.telegram.sendMessage(gid, ctx.message.text, {
    entities: ctx.message.entities,
  }))
);

// Photo
bot.on('photo', (ctx) => {
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  broadcast(ctx, (gid) =>
    ctx.telegram.sendPhoto(gid, photo.file_id, {
      caption: ctx.message.caption,
      caption_entities: ctx.message.caption_entities,
    })
  );
});

// Video
bot.on('video', (ctx) =>
  broadcast(ctx, (gid) =>
    ctx.telegram.sendVideo(gid, ctx.message.video.file_id, {
      caption: ctx.message.caption,
      caption_entities: ctx.message.caption_entities,
    })
  )
);

// Document
bot.on('document', (ctx) =>
  broadcast(ctx, (gid) =>
    ctx.telegram.sendDocument(gid, ctx.message.document.file_id, {
      caption: ctx.message.caption,
      caption_entities: ctx.message.caption_entities,
    })
  )
);

// Audio
bot.on('audio', (ctx) =>
  broadcast(ctx, (gid) =>
    ctx.telegram.sendAudio(gid, ctx.message.audio.file_id, {
      caption: ctx.message.caption,
    })
  )
);

// Voice
bot.on('voice', (ctx) =>
  broadcast(ctx, (gid) => ctx.telegram.sendVoice(gid, ctx.message.voice.file_id))
);

// Sticker
bot.on('sticker', (ctx) =>
  broadcast(ctx, (gid) => ctx.telegram.sendSticker(gid, ctx.message.sticker.file_id))
);

// GIF / Animation
bot.on('animation', (ctx) =>
  broadcast(ctx, (gid) =>
    ctx.telegram.sendAnimation(gid, ctx.message.animation.file_id, {
      caption: ctx.message.caption,
    })
  )
);

// Video note (circle video)
bot.on('video_note', (ctx) =>
  broadcast(ctx, (gid) => ctx.telegram.sendVideoNote(gid, ctx.message.video_note.file_id))
);

// Location
bot.on('location', (ctx) =>
  broadcast(ctx, (gid) =>
    ctx.telegram.sendLocation(gid, ctx.message.location.latitude, ctx.message.location.longitude)
  )
);

// Vercel serverless export
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).json({ ok: true });
    } else {
      res.status(200).send('Messenger Bot Webhook is Active');
    }
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
};