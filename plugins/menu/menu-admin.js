import path from 'path';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (message, { conn, usedPrefix, command }) => {
    const userId = message.sender;
    const groupId = message.isGroup ? message.chat : null;

    const menuText = generateMenuText(usedPrefix, userId, groupId);
    const imagePath = path.join(__dirname, '../../media/admin.jpeg');
    const footerText = global.t('chooseMenu', userId, groupId);
    const mainMenuText = global.t('mainMenuButton', userId, groupId);
    const ownerMenuText = global.t('ownerMenuButton', userId, groupId);
    const securityMenuText = global.t('securityMenuButton', userId, groupId);
    const groupMenuText = global.t('groupMenuButton', userId, groupId);

    await conn.sendMessage(message.chat, {
        image: { url: imagePath },
        caption: menuText,
        footer: footerText,
        buttons: [
            { buttonId: `${usedPrefix}menu`, buttonText: { displayText: mainMenuText }, type: 1 },
            { buttonId: `${usedPrefix}menuowner`, buttonText: { displayText: ownerMenuText }, type: 1 },
            { buttonId: `${usedPrefix}menusicurezza`, buttonText: { displayText: securityMenuText }, type: 1 },
            { buttonId: `${usedPrefix}menugruppo`, buttonText: { displayText: groupMenuText }, type: 1 },
            { buttonId: `${usedPrefix}menumod`, buttonText: { displayText: '🛡️ Menu Mod' }, type: 1 },
        ],
        viewOnce: true,
        headerType: 4,
    }, { quoted: message });
};

handler.help = [
  'menuadmin',
  'adminmenu',
  'menúadmin',
  'menúadministrador',
  'menuadministrador',
  'menuowner',
  'menúpropietario',
  'menupainel',
  'adminmenü',
  '管理菜单',
  '菜单管理员',
  'менюадмин',
  'менюадминистратора',
  'قائمةالمدير',
  'قائمةالمسؤول',
  'प्रशासनमेनू',
  'एडमिनमेनू',
  'menuadmin_fr',
  'menuadministrateur',
  'menuadmin_id',
  'menuadmin_tr'
];
handler.tags = ['menuadmin'];
handler.command = /^(menuadmin|adminmenu|menúadmin|menúadministrador|menuadministrador|menupainel|adminmenü|管理菜单|菜单管理员|менюадмин|менюадминистратора|قائمةالمدير|قائمةالمسؤول|प्रशासनमेनू|एडमिनमेनू|menuadmin_fr|menuadministrateur|menuadmin_id|menuadmin_tr)$/i;


export default handler;

function generateMenuText(prefix, userId, groupId) {
    const menuTitle = global.t('adminMenuTitle', userId, groupId);

    const commandList = `
• 👑 *${global.t('promoteCommand', userId, groupId)}*
• 👑 *${global.t('demoteCommand', userId, groupId)}*
• 👑 *${global.t('warnCommands', userId, groupId)}*
• 👑 *${global.t('muteCommands', userId, groupId)}*
• 👑 *${global.t('setNameCommand', userId, groupId)}*
• 👑 *${global.t('hidetagCommand', userId, groupId)}*
• 👑 *${global.t('tagallCommand', userId, groupId)}*
• 👑 *${global.t('kickCommand', userId, groupId)}*
• 👑 *${global.t('adminsCommand', userId, groupId)}*
• 👑 *${global.t('openCloseCommand', userId, groupId)}*
• 👑 *${global.t('setWelcomeCommand', userId, groupId)}*
• 👑 *${global.t('setByeCommand', userId, groupId)}*
• 👑 *${global.t('inactiveCommand', userId, groupId)}*
• 👑 *${global.t('listNumCommand', userId, groupId)}*
• 👑 *${global.t('cleanupCommand', userId, groupId)}*
• 👑 *${global.t('rulesCommand', userId, groupId)}*
• 👑 *${global.t('listWarnCommand', userId, groupId)}*
• 👑 *${global.t('linkCommand', userId, groupId)}*
• 👑 *${global.t('linkQrCommand', userId, groupId)}*
• 👑 *${global.t('requestsCommand', userId, groupId)}*
    `.trim();

    return `
⋆ ︵ ★ ${menuTitle} ★ ︵ ⋆

${commandList.split('\n').map(line => `୧ ${line.trim()}`).join('\n')}
꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧
> © ${global.t('poweredBy', userId, groupId)} 𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲
`.trim();
}
