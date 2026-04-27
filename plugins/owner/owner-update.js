 import { execSync } from 'child_process';

let handler = async (m, { conn, text }) => {
    const userId = m.sender;
    const groupId = m.chat;
    const nomeDelBot = conn.user?.name || global.db?.data?.nomedelbot || 'ꪶ𖣘ꫂ𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻ꪶ𖣘ꫂ';
    
    try {
        await conn.sendMessage(m.chat, {
            text: global.t('updateInitiating', userId, groupId),
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
        
        const gitCommand = 'git pull' + (m.fromMe && text ? ' ' + text : '');
        const stdout = execSync(gitCommand, { encoding: 'utf8' });
        
        const output = stdout.trim();
        
        if (output.includes('Already up to date') || output.includes('Already up-to-date')) {
            await conn.sendMessage(m.chat, {
                text: global.t('updateNoChanges', userId, groupId),
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
        } else {
            await conn.sendMessage(m.chat, {
                text: global.t('updateSuccess', userId, groupId, { output }),
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
        
    } catch (error) {
        await conn.sendMessage(m.chat, {
            text: global.t('updateError', userId, groupId, { error: error.message }),
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

handler.help = ['aggiornabot', 'update'];
handler.tags = ['owner'];
handler.command = /^(aggiorna|update|aggiornabot)$/i;
handler.rowner = true;

export default handler;
