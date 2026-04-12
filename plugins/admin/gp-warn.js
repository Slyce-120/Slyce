
 
function ensureWarnState(user, chatId) {
  if (!user.warns || typeof user.warns !== 'object') user.warns = {};
  if (!user.warns[chatId] && Number(user.warn) > 0) user.warns[chatId] = Number(user.warn);
  user.warns[chatId] = Number(user.warns[chatId] || 0);
}

function getTotalWarns(user) {
  if (!user.warns || typeof user.warns !== 'object') return Number(user.warn || 0);
  return Object.values(user.warns).reduce((sum, count) => sum + Number(count || 0), 0);
}

let handler = async (m, { conn, text, args, groupMetadata, usedPrefix, command }) => {
  let war = 2; 
  
  const userId = m.sender;
  const groupId = m.isGroup ? m.chat : null;

  let who;
  if (m.isGroup) {
    who = m.mentionedJid?.[0] || m.quoted?.sender;
  } else {
    who = m.chat;
  }

  if (!global.db.data.users[who]) {
    global.db.data.users[who] = {};
  }

  if (!who) return m.reply(global.t('warnMentionUser', userId, groupId));

  if (who === conn.user.jid) {
    return m.reply(global.t('warnBotImmune', userId, groupId));
  }

  let user = global.db.data.users[who];
  ensureWarnState(user, m.chat);
  let warn = user.warns[m.chat] || 0;
  let nomeDelBot = global.db.data.nomedelbot || `𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲`;

  const messageOptions = {
    contextInfo: {
      mentionedJid: [who],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363259442839354@newsletter',
        serverMessageId: '',
        newsletterName: `${nomeDelBot}`
      }
    }
  };

  if (warn < war) {
    user.warns[m.chat] = warn + 1;
    user.warn = getTotalWarns(user);
    await conn.sendMessage(m.chat, {
      text: global.t('warnMessage', userId, groupId, { warns: user.warns[m.chat] }),
      ...messageOptions
    });

  } else if (warn >= war) {
    user.warns[m.chat] = 0;
    user.warn = getTotalWarns(user);
    await conn.sendMessage(m.chat, {
      text: global.t('warnBanMessage', userId, groupId),
      ...messageOptions
    });
    await sleep(1000);
    await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
  }
};

handler.help = ['warn @user','ammonisci @user','avvertimento @user','warning @user','advertencia @usuario','aviso @usuario','aviso @usuário','warnung @benutzer','警告 @用户','предупреждение @пользователь','تحذير @مستخدم','चेतावनी @उपयोगकर्ता','avertissement @utilisateur','peringatan @pengguna','uyarı @kullanıcı'];
handler.tags = ['group'];
handler.command = /^(warn|ammonisci|avvertimento|warning|advertencia|aviso|warnung|警告|предупреждение|تحذير|चेतावनी|avertissement|peringatan|uyarı)$/i;

handler.group = true;
handler.admin = true;
handler.moderator = true;
handler.botAdmin = true;

export default handler;

// Funzione di attesa
const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
