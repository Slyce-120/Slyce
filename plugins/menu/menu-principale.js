import { performance } from 'perf_hooks';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (message, { conn, usedPrefix, command }) => {
    const userId = message.sender;
    const groupId = message.isGroup ? message.chat : null;
    
    const userCount = Object.keys(global.db.data.users).length;
    const botName = global.db.data.nomedelbot || '𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻';

    const menuText = generateMenuText(usedPrefix, botName, userCount, userId, groupId);

    const photopath = path.join(__dirname, '../../media/menu.jpeg'); 
    
    const footerText = global.t('menuFooter', userId, groupId);
    const adminMenuText = global.t('menuAdmin', userId, groupId);
    const ownerMenuText = global.t('menuOwner', userId, groupId);
    const securityMenuText = global.t('menuSecurity', userId, groupId);
    const groupMenuText = global.t('menuGroup', userId, groupId);
    const aiMenuText = global.t('menuAI', userId, groupId);
    
    await conn.sendMessage(
        message.chat,
        {
            image: { url: photopath },
            caption: menuText,
            footer: footerText,
            buttons: [
                { buttonId: `${usedPrefix}menuadmin`, buttonText: { displayText: adminMenuText }, type: 1 },
                { buttonId: `${usedPrefix}menuowner`, buttonText: { displayText: ownerMenuText }, type: 1 },
                { buttonId: `${usedPrefix}menusicurezza`, buttonText: { displayText: securityMenuText }, type: 1 },
                { buttonId: `${usedPrefix}menugruppo`, buttonText: { displayText: groupMenuText }, type: 1 },
                { buttonId: `${usedPrefix}menumod`, buttonText: { displayText: '🛡️ Menu Mod' }, type: 1 },
            ],
            viewOnce: true,
            headerType: 4
        }
    );
};

handler.help = [
  'menu',
  'comandi',
  'commands',
  'menú',
  'comandos',
  'menu_pt',
  'comandos_pt',
  'menü',
  'befehle',
  '菜单',
  '命令',
  'меню',
  'команды',
  'قائمة',
  'أوامر',
  'मेनू',
  'आदेश',
  'menu_fr',
  'commandes',
  'menu_id',
  'perintah',
  'menu_tr',
  'komutlar'
];
handler.tags = ['menu'];
handler.command = /^(menu|comandi|commands|menú|comandos|menu_pt|comandos_pt|menü|befehle|菜单|命令|меню|команды|قائمة|أوامر|मेनू|आदेश|menu_fr|commandes|menu_id|perintah|menu_tr|komutlar)$/i;


export default handler;

function generateMenuText(prefix, botName, userCount, userId, groupId) {
    const vs = global.vs;
    const menuTitle = global.t('mainMenuTitle', userId, groupId);
    const installText = global.t('installCommand', userId, groupId);
    const systemText = global.t('systemCommand', userId, groupId);
    const pingText = global.t('pingCommand', userId, groupId);
    const reportText = global.t('reportCommand', userId, groupId);
    const suggestText = global.t('suggestCommand', userId, groupId);
    const versionText = global.t('versionLabel', userId, groupId);
    const usersText = global.t('usersLabel', userId, groupId);
    
    return `
⋆ ︵★ ${menuTitle} ★︵ ⋆
୧ ⚙️ ୭ *${prefix}${systemText}*
୧ 📝 ୭ *${prefix}${reportText}* 
୧ 💡 ୭ *${prefix}${suggestText}*
୧ 🕸️ ୭ *${prefix}staff*
୧・*${0.8}:* ${vs}
  ୧・*𝐂𝐎𝐋𝐋𝐀𝐁:* ${ChatUnity}
╰♡꒷ ๑ ⋆˚₊⋆──ʚ˚ɞ──⋆˚₊⋆ ๑ ⪩
`.trim();
}
