function getJidUser(jid) {
    return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''
}

function normalizePhoneJid(value) {
    if (typeof value !== 'string') return null
    if (value.includes('@')) return value
    const digits = value.replace(/\D/g, '')
    return digits ? `${digits}@s.whatsapp.net` : null
}

function resolveTarget(m, text = '') {
    const mentioned = m.mentionedJid?.[0]
    if (mentioned) return mentioned
    if (m.quoted?.sender) return m.quoted.sender
    return normalizePhoneJid(text.trim())
}

function getGroupOwnerJid(metadata) {
    return metadata?.owner || metadata?.subjectOwner || null
}

let handler = async (m, { conn, command, text, isAdmin }) => {
    if (!isAdmin) throw global.t('muteAdminOnly', m.sender, m.chat)

    const isMute = /^(muta|mute|silenciar|silencia|silenciar_pt|silenciar_es|muter|stummschalten|禁言|заглушить|كتم|म्यूट|bungkam|sustur)$/i.test(command)
    const target = resolveTarget(m, text || '')

    if (!target) {
        throw isMute
            ? global.t('muteNoTarget', m.sender, m.chat)
            : global.t('unmuteNoTarget', m.sender, m.chat)
    }

    const botJid = conn.decodeJid ? conn.decodeJid(conn.user?.jid || conn.user?.id) : (conn.user?.jid || conn.user?.id)
    const senderJid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const targetJid = conn.decodeJid ? conn.decodeJid(target) : target
    const metadata = await conn.groupMetadata(m.chat)
    const ownerJid = conn.decodeJid ? conn.decodeJid(getGroupOwnerJid(metadata)) : getGroupOwnerJid(metadata)

    if (!global.db.data.users[targetJid]) global.db.data.users[targetJid] = {}
    const user = global.db.data.users[targetJid]

    // Migrazione: se muto è booleano, converti in oggetto per-gruppo
    if (typeof user.muto !== 'object' || user.muto === null) {
        user.muto = {}
    }

    if (targetJid === botJid) throw global.t('muteBotImmune', m.sender, m.chat)
    if (targetJid === ownerJid) throw global.t('muteGroupOwnerImmune', m.sender, m.chat)
    if (targetJid === senderJid) {
        throw isMute
            ? global.t('muteSelfDenied', m.sender, m.chat)
            : global.t('unmuteSelfDenied', m.sender, m.chat)
    }

    if (isMute) {
        if (user.muto[m.chat]) throw global.t('muteAlreadyMuted', m.sender, m.chat)
        user.muto[m.chat] = true
        await conn.sendMessage(m.chat, {
            text: global.t('muteSuccess', m.sender, m.chat, { target: getJidUser(targetJid) }),
            mentions: [targetJid]
        }, { quoted: m })
        return
    }

    if (!user.muto[m.chat]) throw global.t('unmuteNotMuted', m.sender, m.chat)
    delete user.muto[m.chat]
    await conn.sendMessage(m.chat, {
        text: global.t('unmuteSuccess', m.sender, m.chat, { target: getJidUser(targetJid) }),
        mentions: [targetJid]
    }, { quoted: m })
}

handler.help = ['muta @user', 'smuta @user']
handler.tags = ['group']
handler.command = /^(muta|smuta|mute|unmute|silenciar|dessilenciar|silencia|dessilencia|silenciar_pt|dessilenciar_pt|silenciar_es|dessilenciar_es|muter|démuter|stummschalten|entstummschalten|禁言|解禁|заглушить|разглушить|كتم|رفع_الكتم|म्यूट|अनम्यूट|bungkam|buka_bungkam|sustur|susturmayı_kaldır)$/i
handler.group = true
handler.admin = true
handler.moderator = true
handler.botAdmin = true

export default handler
