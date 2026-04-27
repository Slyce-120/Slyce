 
function getWarnMap(user, fallbackChatId = null) {
    if (user?.warns && typeof user.warns === 'object') {
        return Object.fromEntries(
            Object.entries(user.warns).map(([chatId, count]) => [chatId, Number(count || 0)])
        );
    }

    if (fallbackChatId && Number(user?.warn) > 0) {
        return { [fallbackChatId]: Number(user.warn) };
    }

    return {};
}

let handler = async (m, { conn, isOwner }) => {
    const userId = m.sender;
    const groupId = m.chat;

    if (!m.isGroup && !isOwner) {
        return conn.reply(m.chat, global.t('listawarnOwnerOnly', userId, groupId), m);
    }

    let groupMembers = [];
    let groupName = '';
    if (m.isGroup) {
        let groupMeta = await conn.groupMetadata(m.chat);
        groupMembers = groupMeta.participants.map(p => p.id);
        groupName = groupMeta.subject;
    } else {
        groupName = global.t('listawarnAllUsers', userId, groupId);
    }

    let adv = Object.entries(global.db?.data?.users || {}).filter(([jid, user]) => {
        const warnMap = getWarnMap(user, m.isGroup ? m.chat : null);
        if (m.isGroup) {
            return Number(warnMap[m.chat] || 0) > 0 && groupMembers.includes(jid);
        } else {
            return Object.values(warnMap).some(warnCount => warnCount > 0);
        }
    });

    let userList = '';
    if (adv.length > 0) {
        for (let i = 0; i < adv.length; i++) {
            let [jid, user] = adv[i];
            const warnMap = getWarnMap(user, m.isGroup ? m.chat : null);
            let userGroupInfo = '';
            if (!m.isGroup && isOwner) {
                let userGroupsWithWarns = [];
                try {
                    if (Object.keys(warnMap).length) {
                        for (let [groupId, warnCount] of Object.entries(warnMap)) {
                            if (warnCount > 0) {
                                try {
                                    let groupMeta = await conn.groupMetadata(groupId);
                                    if (groupMeta) {
                                        userGroupsWithWarns.push(`${groupMeta.subject} (${warnCount}/3)`);
                                    }
                                } catch (e) {
                                    userGroupsWithWarns.push(`Gruppo ${groupId.split('@')[0]} (${warnCount}/3)`);
                                }
                            }
                        }
                    }
                    if (userGroupsWithWarns.length > 0) {
                        userGroupInfo = `\n┊ 『 👥 』 ${global.t('listawarnGroups', userId, groupId)} ${userGroupsWithWarns.join(', ')}`;
                    } else {
                        userGroupInfo = `\n┊ 『 👥 』 ${global.t('listawarnGroups', userId, groupId)} ${global.t('listawarnNoActiveWarns', userId, groupId)}`;
                    }
                } catch (e) {
                    userGroupInfo = `\n┊ 『 👥 』 ${global.t('listawarnGroups', userId, groupId)} ${global.t('listawarnErrorRetrieving', userId, groupId)}`;
                }
            }

            let warnCount = 0;
            if (m.isGroup) {
                warnCount = Number(warnMap[m.chat] || 0);
            } else {
                warnCount = Object.values(warnMap).reduce((sum, w) => sum + Number(w || 0), 0);
            }

            userList += `┊ 『 ⚠️ 』 ${global.t('listawarnUserNumber', userId, groupId, { index: i + 1 })} ${conn.getName(jid) || global.t('listawarnUnknownUser', userId, groupId)} ${m.isGroup ? `(${warnCount}/3)` : `(${global.t('listawarnTotalWarns', userId, groupId, { count: warnCount })})`}
┊ 『 📱 』 ${global.t('listawarnTag', userId, groupId)} ${isOwner ? '@' + jid.split('@')[0] : jid.split('@')[0]}${userGroupInfo}
┊
`;
        }
    } else {
        userList = `┊ 『 ✅ 』 ${global.t('listawarnNoWarns', userId, groupId)}\n┊\n`;
    }

    const nomeDelBot = conn.user?.name || global.db?.data?.nomedelbot || '𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻';
    let caption = `╭★────★────★
┊ㅤㅤ${global.t('listawarnTitle', userId, groupId)}
┊
┊ 『 📋 』 ${m.isGroup ? global.t('listawarnGroup', userId, groupId) : global.t('listawarnMode', userId, groupId)}: ${groupName}
┊ 『 👥 』 ${global.t('listawarnTotal', userId, groupId, { count: adv.length })}
┊
${userList}╰★────★────★`;

    await conn.sendMessage(m.chat, {
        text: caption,
        mentions: await conn.parseMention(caption),
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
};

handler.help = ['avvertimenti','warns','listawarn','warnlist'];
handler.tags = ['gruppo'];
handler.command = /^(avvertimenti|listav|warns|listawarn|listavvertiti|listaavvertiti|warnlist|listwarn|avvertiti|avisos|advertencias|avisos_pt|advertências|warnungen|avertissements|предупреждения|تحذيرات|चेतावनी|ostrzeżenia)$/i;

export default handler;
