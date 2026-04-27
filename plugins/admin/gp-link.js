 async function handler(m, { conn, isBotAdmin }) {
    const userId = m.sender;
    const groupId = m.chat;
    if (!isBotAdmin) {
        return await conn.sendMessage(m.chat, {
            text: global.t('linkgroupNoBotAdmin', userId, groupId)
        }, { quoted: m });
    }
    const metadata = await conn.groupMetadata(m.chat);
    const inviteCode = await conn.groupInviteCode(m.chat);
    const nomeDelBot = conn.user?.name || global.db?.data?.nomedelbot || '𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻';
    await conn.sendMessage(m.chat, {
        text: global.t('linkgroupLinkTitle', userId, groupId, { groupName: metadata.subject }),
        footer: global.t('linkgroupLinkFooter', userId, groupId),
        interactiveButtons: [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: global.t('linkgroupCopyButton', userId, groupId),
                    copy_code: `https://chat.whatsapp.com/${inviteCode}`
                })
            }
        ],
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
handler.help = [
  'linkgroup','linkgruppo','linkgrupp','linkdelgruppo',
  'groupLink','grouplink','linkchat','chatlink',
  'enlacegrupo','linkgrupo','enlacechat',
  'linkdogrupo','linkgrupo_pt',
  'gruppenlink','gruppenverweis',
  '链接群组','群链接',
  'ссылкагруппы','ссылканагруппу',
  'رابطالمجموعة','لينكجروب',
  'ग्रुपलिंक','समूहलिंक',
  'liengroupe','liendugroupe',
  'tautanGrup','linkgrup_id',
  'gruplink','grupbağlantısı'
];
handler.tags = ['group'];
handler.command = /^(linkgroup|link|linkgruppo|linkgrupp|linkdelgruppo|groupLink|grouplink|linkchat|chatlink|enlacegrupo|linkgrupo|enlacechat|linkdogrupo|linkgrupo_pt|gruppenlink|gruppenverweis|链接群组|群链接|ссылкагруппы|ссылканагруппу|رابطالمجموعة|لينكجروب|ग्रुपलिंक|समूहलिंक|liengroupe|liendugroupe|tautanGrup|linkgrup_id|gruplink|grupbağlantısı)$/i;

handler.group = true;
handler.botAdmin = true;
export default handler;
