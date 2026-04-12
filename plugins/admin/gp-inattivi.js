 
let handler = async (m, { conn, text, args, groupMetadata, isAdmin, isOwner }) => {
    await conn.sendPresenceUpdate('composing', m.chat);

    const userId = m.sender;
    const groupId = m.isGroup ? m.chat : null;

    const lama = 86400000 * 7; // 7 giorni
    const now = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" });
    const milliseconds = new Date(now).getTime();

    let member = groupMetadata.participants.map(v => v.id);
    let total = 0;
    const sider = [];

    for (let i = 0; i < member.length; i++) {
        let users = groupMetadata.participants.find(u => u.id === member[i]);
        if ((typeof global.db.data.users[member[i]] === 'undefined' || milliseconds - global.db.data.users[member[i]].lastseen > lama) && !users?.isAdmin && !users?.isSuperAdmin) {
            if (typeof global.db.data.users[member[i]] !== 'undefined') {
                if (global.db.data.users[member[i]].banned !== true) {
                    total++;
                    sider.push(member[i]);
                }
            } else {
                total++;
                sider.push(member[i]);
            }
        }
    }

    const nomeDelBot = global.db.data.nomedelbot || 'ChatUnity';

    if (!args[0]) {
        const buttons = [
            {
                buttonId: `.inattivi lista`,
                buttonText: { displayText: global.t('inactiveListButton', userId, groupId) },
                type: 1
            },
            {
                buttonId: `.inattivi rimuovi`,
                buttonText: { displayText: global.t('inactiveRemoveButton', userId, groupId) },
                type: 1
            }
        ];

        const buttonMessage = {
            text: `꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧\n${global.t('inactiveMenuTitle', userId, groupId)}\n\n${global.t('inactiveMenuFound', userId, groupId, { inactive: total, total: member.length })}`,
            footer: global.t('inactiveFooter', userId, groupId),
            buttons: buttons,
            headerType: 1
        };
        return conn.sendMessage(m.chat, buttonMessage, { quoted: m });
    }

    if (args[0] === 'lista') {
        if (!isAdmin && !isOwner) {
            return conn.reply(m.chat, global.t('inactiveNotAdmin', userId, groupId), m);
        }
        if (total === 0) {
            const successButton = {
                text: global.t('inactiveListNone', userId, groupId),
                footer: global.t('inactiveFooter', userId, groupId),
                buttons: [{
                    buttonId: `.inattivi`,
                    buttonText: { displayText: global.t('inactiveBackButton', userId, groupId) },
                    type: 1
                }],
                headerType: 1
            };
            return conn.sendMessage(m.chat, successButton, { quoted: m });
        }
        const groupName = await conn.getName(m.chat);
        const message = `✧ ${global.t('inactiveListTitle', userId, groupId)}\n${global.t('inactiveGroupLabel', userId, groupId)}: ${groupName}\n\n${sider.map((v, i) => global.t('inactiveListItem', userId, groupId, { index: i + 1, user: v.replace(/@.+/, '') })).join('\n')}`;

        const listButtons = [
            {
                buttonId: `.inattivi rimuovi`,
                buttonText: { displayText: global.t('inactiveRemoveButton', userId, groupId) },
                type: 1
            },
            {
                buttonId: `.inattivi`,
                buttonText: { displayText: global.t('inactiveBackButton', userId, groupId) },
                type: 1
            }
        ];

        const listMessage = {
            text: message,
            footer: global.t('inactiveFooter', userId, groupId),
            buttons: listButtons,
            headerType: 1,
            contextInfo: { mentionedJid: sider }
        };
        return conn.sendMessage(m.chat, listMessage, { quoted: m });
    }

    if (args[0] === 'rimuovi') {
        if (!isOwner && !isAdmin) {
            return conn.reply(m.chat, global.t('inactiveNotAdmin', userId, groupId), m);
        }
        if (total === 0) {
            const noRemoveButton = {
                text: global.t('inactiveRemoveNone', userId, groupId),
                footer: global.t('inactiveFooter', userId, groupId),
                buttons: [{
                    buttonId: `.inattivi`,
                    buttonText: { displayText: global.t('inactiveBackButton', userId, groupId) },
                    type: 1
                }],
                headerType: 1
            };
            return conn.sendMessage(m.chat, noRemoveButton, { quoted: m });
        }
        const confirmButtons = [
            {
                buttonId: `.inattivi conferma`,
                buttonText: { displayText: global.t('inactiveConfirmButton', userId, groupId) },
                type: 1
            },
            {
                buttonId: `.inattivi`,
                buttonText: { displayText: global.t('inactiveCancelButton', userId, groupId) },
                type: 1
            }
        ];
        const confirmMessage = {
            text: global.t('inactiveRemoveStart', userId, groupId, { count: total }),
            footer: global.t('inactiveFooter', userId, groupId),
            buttons: confirmButtons,
            headerType: 1
        };
        return conn.sendMessage(m.chat, confirmMessage, { quoted: m });
    }

    if (args[0] === 'conferma') {
        if (!isOwner && !isAdmin) {
            return conn.reply(m.chat, global.t('inactiveNotAdmin', userId, groupId), m);
        }
        if (total === 0) {
            return conn.reply(m.chat, global.t('inactiveRemoveNone', userId, groupId), m);
        }
        let removedCount = 0;
        const errors = [];
        for (const user of sider) {
            try {
                await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
                removedCount++;
            } catch (e) {
                errors.push(user);
            }
        }
        const successMessage = removedCount > 0
            ? global.t('inactiveRemoveSuccess', userId, groupId, { removed: removedCount, errors: errors.length })
            : global.t('inactiveRemoveNone', userId, groupId);

        const resultButton = {
            text: successMessage,
            footer: global.t('inactiveFooter', userId, groupId),
            buttons: [{
                buttonId: `.inattivi`,
                buttonText: { displayText: global.t('inactiveBackButton', userId, groupId) },
                type: 1
            }],
            headerType: 1
        };
        return conn.sendMessage(m.chat, resultButton, { quoted: m });
    }

    const errorButton = {
        text: global.t('inactiveUnknown', userId, groupId),
        footer: global.t('inactiveFooter', userId, groupId),
        buttons: [{
            buttonId: `.inattivi`,
            buttonText: { displayText: global.t('inactiveBackButton', userId, groupId) },
            type: 1
        }],
        headerType: 1
    };
    return conn.sendMessage(m.chat, errorButton, { quoted: m });
};

handler.help = [
  'inattivi','inactive',
  'inactivos','inactivo',
  'inativos','inativo',
  'inaktiv','inaktive',
  '不活跃','非活跃',
  'неактивные','неактивный',
  'غيرنشط','غيرفعال',
  'निष्क्रिय','निष्क्रियउपयोगकर्ता',
  'inactif','inactifs',
  'tidakaktif','pengguna_tidakaktif',
  'aktifdeğil','pasif'
];
handler.tags = ['group'];
handler.command = /^(inattivi|inactive|inactivos|inactivo|inativos|inativo|inaktiv|inaktive|不活跃|非活跃|неактивные|неактивный|غيرنشط|غيرفعال|निष्क्रिय|निष्क्रियउपयोगकर्ता|inactif|inactifs|tidakaktif|pengguna_tidakaktif|aktifdeğil|pasif)$/i;
handler.group = true;
handler.moderator = true;
handler.owner = false;
handler.botAdmin = true;


export default handler;
