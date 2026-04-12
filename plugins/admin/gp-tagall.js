 
let handler = async (m, { isOwner, isAdmin, conn, text, participants, args }) => {
    if (!(isAdmin || isOwner)) return;
    
    const userId = m.sender;
    const groupId = m.isGroup ? m.chat : null;
    const nomeDelBot = global.db.data.nomedelbot || 'ChatUnity';
    
    const title = global.t('tagallTitle', userId, groupId);
    const botLabel = global.t('tagallBot', userId, groupId);
    const messageLabel = global.t('tagallMessage', userId, groupId);
    const emptyMessage = global.t('tagallEmptyMessage', userId, groupId);
    const memberCount = global.t('tagallMemberCount', userId, groupId, { count: participants.length });
    
    let message = args.join` ` || emptyMessage;
    
    let tagText = `${title}

꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧
୧ ${botLabel}: ${nomeDelBot}
୧ ${messageLabel}: ${message}
୧ ${memberCount}
꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧

`;
    
    for (let user of participants) {
        tagText += `✧ @${user.id.split('@')[0]}\n`;
    }
    
    tagText += '\n╰♡꒷ ๑ ⋆˚₊⋆───ʚ˚ɞ───⋆˚₊⋆ ๑ ⪩';
    
    await conn.sendMessage(m.chat, {
        text: tagText,
        mentions: participants.map(p => p.id),
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363259442839354@newsletter',
                serverMessageId: '',
                newsletterName: `${nomeDelBot}`
            }
        }
    }, { quoted: m });
};

handler.help = ['tagall <message>'];
handler.tags = ['group'];
handler.command = /^(tagall|invocar|marcar|todos|everyone)$/i;
handler.group = true;
handler.admin = true;
handler.moderator = true;

export default handler;
