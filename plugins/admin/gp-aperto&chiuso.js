 
let handler = async (m, { conn, command }) => {
    const userId = m.sender;
    const groupId = m.isGroup ? m.chat : null;
    const nomeDelBot = global.db.data.nomedelbot || 'ChatUnity';
    
    let isOpen = /^(aperto|open|abrir|aberto|öffnen|开放|открыть|فتح|खोलना|ouvrir|buka|aç)$/i.test(command);
    
    await conn.groupSettingUpdate(m.chat, isOpen ? 'not_announcement' : 'announcement');
    
    await conn.sendMessage(m.chat, {
        text: isOpen ? global.t('groupOpen', userId, groupId) : global.t('groupClose', userId, groupId),
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

handler.help = [
  'open','close',
  'aperto','chiuso',
  'abrir','cerrar',
  'aberto','fechado',
  'öffnen','schließen',
  '开放','关闭',
  'открыть','закрыть',
  'فتح','إغلاق',
  'खोलना','बंद',
  'ouvrir','fermer',
  'buka','tutup',
  'aç','kapat'
];
handler.tags = ['group'];
handler.command = /^(aperto|chiuso|open|close|abrir|cerrar|aberto|fechado|öffnen|schließen|开放|关闭|открыть|закрыть|فتح|إغلاق|खोलना|बंद|ouvrir|fermer|buka|tutup|aç|kapat)$/i;
handler.admin = true;
handler.moderator = true;
handler.botAdmin = true;
handler.group = true;

export default handler;

