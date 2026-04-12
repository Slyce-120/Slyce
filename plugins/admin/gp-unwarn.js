 
function ensureWarnState(user, chatId) {
    if (!user.warns || typeof user.warns !== 'object') user.warns = {};
    if (!user.warns[chatId] && Number(user.warn) > 0) user.warns[chatId] = Number(user.warn);
    user.warns[chatId] = Number(user.warns[chatId] || 0);
}

function getTotalWarns(user) {
    if (!user.warns || typeof user.warns !== 'object') return Number(user.warn || 0);
    return Object.values(user.warns).reduce((sum, count) => sum + Number(count || 0), 0);
}

let handler = async (m, { conn, args, groupMetadata }) => {
    const userId = m.sender;
    const groupId = m.isGroup ? m.chat : null;
    const nomeDelBot = global.db.data.nomedelbot || `𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲`;
    
    let who;
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
    else who = m.chat;
    
    if (!who) return m.reply(global.t('unwarnNoUser', userId, groupId));
    if (!(who in global.db.data.users)) return m.reply(global.t('unwarnUserNotFound', userId, groupId));
    
    let user = global.db.data.users[who];
    ensureWarnState(user, m.chat);
    let warn = user.warns[m.chat];
    
    if (warn > 0) {
        user.warns[m.chat] = warn - 1;
        user.warn = getTotalWarns(user);
        
        const messageOptions = {
            text: global.t('unwarnSuccess', userId, groupId, { remaining: user.warns[m.chat] }),
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
    
        await conn.sendMessage(m.chat, messageOptions);
    } else {
        return m.reply(global.t('unwarnNoWarnings', userId, groupId));
    }
};

handler.help = [
  'delwarn @user',             // Inglese
  'unwarn @user',              // Inglese
  'rimuoviavvertimento @user', // Italiano
  'quitaraviso @usuario',      // Spagnolo
  'removeraviso @usuário',     // Portoghese
  'warnlöschen @benutzer',     // Tedesco
  '删除警告 @用户',              // Cinese
  'удалитьпредупреждение @пользователь', // Russo
  'إزالةتحذير @مستخدم',        // Arabo
  'चेतावनीहटाओ @उपयोगकर्ता',   // Hindi
  'supprimeravertissement @utilisateur', // Francese
  'hapusperingatan @pengguna', // Indonesiano
  'uyarısil @kullanıcı'        // Turco
];
handler.tags = ['group'];
handler.command = /^(delwarn|unwarn|rimuoviavvertimento|quitaraviso|removeraviso|warnlöschen|删除警告|удалитьпредупреждение|إزالةتحذير|चेतावनीहटाओ|supprimeravertissement|hapusperingatan|uyarısil)$/i;

handler.group = true;
handler.admin = true;
handler.moderator = true;
handler.botAdmin = true;

export default handler;
