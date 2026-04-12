import fs from 'fs'

function getJidUser(jid) {
  return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''
}

function normalizePhoneJid(value) {
  if (typeof value !== 'string') return null
  if (value.includes('@')) return value
  const digits = value.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : null
}

function resolveTarget(m, conn, participants, text = '') {
  const rawMentions = m.msg?.contextInfo?.mentionedJid || []

  const getParticipantPhoneJid = participant => {
    for (const candidate of [participant?.phoneNumber, participant?.pn, participant?.participantPn, participant?.jid, participant?.id]) {
      const normalized = typeof candidate === 'string'
        ? (candidate.includes('@') ? candidate : `${candidate.replace(/\D/g, '')}@s.whatsapp.net`)
        : null
      if (!normalized?.endsWith('@s.whatsapp.net')) continue
      return normalized
    }
    return participant?.id ? conn.decodeJid(participant.id) : null
  }

  const resolveLid = (jid) => {
    if (!jid) return jid
    const jidUser = getJidUser(jid)
    const match = participants.find(p =>
      conn.decodeJid(p.id) === jid ||
      p.lid === jid ||
      conn.decodeJid(p.lid || '') === jid ||
      getJidUser(p.id) === jidUser ||
      getJidUser(p.lid) === jidUser
    )
    if (match) return getParticipantPhoneJid(match) || conn.decodeJid(match.id)
    return conn.decodeJid(jid)
  }

  const resolvedMentions = rawMentions.map(resolveLid)
  const mention = m.mentionedJid?.[0] || resolvedMentions[0] || (m.quoted ? m.quoted.sender : null)
  if (mention) return mention

  const explicitNumber = text?.replace(/[^0-9]/g, '')
  if (explicitNumber) return normalizePhoneJid(explicitNumber)
  return null
}

let handler = async (m, { conn, command, text, isAdmin, isOwner, participants }) => {
  const chat = global.db.data.chats[m.chat]
  if (!chat) return

  if (!chat.moderators) chat.moderators = []

  const isAddMod = /^(addmod|aggiungimod|aggiungimoderatore|añadirmod|adicionarmod|modhinzufügen|添加管理|добавитьмод|إضافةمشرف|मॉडजोड़ें|ajoutermod|tambahmod|modekle)$/i.test(command)
  const isRemoveMod = /^(removemod|rimuovimod|rimuovimoderatore|eliminarmod|removermod|modentfernen|移除管理|удалитьмод|إزالةمشرف|मॉडहटाओ|retirermod|hapusmod|modkaldır)$/i.test(command)
  const isListMod = /^(listmod|listamod|listamods|listamoderatori|moderatori|moderators|modlist)$/i.test(command)

  if (isListMod) {
    if (chat.moderators.length === 0) {
      return conn.sendMessage(m.chat, {
        text: '🛡️ Non ci sono moderatori in questo gruppo.',
      }, { quoted: m })
    }

    let listText = '╭★ 🛡️ *Moderatori del gruppo* ★╮\n'
    for (let i = 0; i < chat.moderators.length; i++) {
      const modJid = chat.moderators[i]
      listText += `│ ${i + 1}. @${getJidUser(modJid)}\n`
    }
    listText += '╰★────────────★╯'

    return conn.sendMessage(m.chat, {
      text: listText,
      mentions: chat.moderators
    }, { quoted: m })
  }

  const groupMeta = await conn.groupMetadata(m.chat).catch(() => null)
  const groupParticipants = groupMeta?.participants || []
  const target = resolveTarget(m, conn, groupParticipants, text)

  if (!target) {
    return conn.sendMessage(m.chat, {
      text: isAddMod
        ? 'ⓘ Menziona o rispondi alla persona da aggiungere come moderatore'
        : 'ⓘ Menziona o rispondi alla persona da rimuovere come moderatore'
    }, { quoted: m })
  }

  const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
  if (target === conn.user.jid) {
    return conn.sendMessage(m.chat, { text: 'ⓘ Il bot non può essere moderatore' }, { quoted: m })
  }

  if (isAddMod) {
    if (chat.moderators.includes(target)) {
      return conn.sendMessage(m.chat, {
        text: `ⓘ @${getJidUser(target)} è già moderatore`,
        mentions: [target]
      }, { quoted: m })
    }

    chat.moderators.push(target)

    return conn.sendMessage(m.chat, {
      text: `🛡️ @${getJidUser(target)} è stato aggiunto come *moderatore*\n\nOra può utilizzare i comandi essenziali di gestione del gruppo.`,
      mentions: [target]
    }, { quoted: m })
  }

  if (isRemoveMod) {
    const index = chat.moderators.indexOf(target)
    if (index === -1) {
      return conn.sendMessage(m.chat, {
        text: `ⓘ @${getJidUser(target)} non è moderatore`,
        mentions: [target]
      }, { quoted: m })
    }

    chat.moderators.splice(index, 1)

    return conn.sendMessage(m.chat, {
      text: `🛡️ @${getJidUser(target)} è stato rimosso dal ruolo di *moderatore*`,
      mentions: [target]
    }, { quoted: m })
  }
}

handler.help = [
  'addmod @user', 'removemod @user', 'listmod',
  'aggiungimod @user', 'rimuovimod @user', 'listamod',
  'moderatori'
]
handler.tags = ['group']
handler.command = /^(addmod|aggiungimod|aggiungimoderatore|removemod|rimuovimod|rimuovimoderatore|listmod|listamod|listamods|listamoderatori|moderatori|moderators|modlist|añadirmod|eliminarmod|adicionarmod|removermod|modhinzufügen|modentfernen|添加管理|移除管理|добавитьмод|удалитьмод|إضافةمشرف|إزالةمشرف|मॉडजोड़ें|मॉडहटाओ|ajoutermod|retirermod|tambahmod|hapusmod|modekle|modkaldır)$/i
handler.group = true
handler.admin = true

export default handler
