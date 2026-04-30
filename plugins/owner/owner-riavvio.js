 
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (m, { conn }) => {
    const userId = m.sender;
    const groupId = m.chat;
    const nomeDelBot = conn.user?.name || global.db?.data?.nomedelbot || '𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻';
    
    try {
        const { key } = await conn.sendMessage(m.chat, {
            text: global.t('restartInitiating', userId, groupId),
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363259442839354@newsletter',
                    serverMessageId: '',
                    newsletterName: nomeDelBot
                }
            }
        }, { quoted: m });
        
        await delay(1000);
        
        await conn.sendMessage(m.chat, {
            text: '🚀🚀🚀🚀',
            edit: key
        });
        
        await delay(1000);
        
        await conn.sendMessage(m.chat, {
            text: global.t('restartProgress', userId, groupId),
            edit: key
        });
        
        await delay(500);
        
        await conn.sendMessage(m.chat, {
            text: global.t('restartSuccess', userId, groupId),
            edit: key
        });
        
        await delay(1000);
        
        process.exit(0);
        
    } catch (error) {
        await conn.sendMessage(m.chat, {
            text: global.t('restartError', userId, groupId, { error: error.message }),
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363259442839354@newsletter',
                    serverMessageId: '',
                    newsletterName: nomeDelBot
                }
            }
        }, { quoted: m });
    }
};

handler.help = ['riavvia', 'restart'];
handler.tags = ['owner'];
handler.command = /^(riavvia|restart)$/i;
handler.owner = true;

export default handler;
