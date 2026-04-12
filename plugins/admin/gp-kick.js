import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function handler(m, { isBotAdmin, isOwner, text, command, conn }) {
  const isSimulation = /simkick/i.test(command)

  if (!isBotAdmin && !isSimulation) {
    return conn.sendMessage(m.chat, { text: 'ⓘ Devo essere admin per poter funzionare' }, { quoted: m })
  }

  const rawMentions = m.msg?.contextInfo?.mentionedJid || []
  const groupMeta = await conn.groupMetadata(m.chat).catch(() => null)
  const participants = groupMeta?.participants || []

  const getJidUser = jid => typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''

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

  if (!mention)
    return conn.sendMessage(m.chat, { text: 'ⓘ Menziona la persona da rimuovere' }, { quoted: m })

  const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
  if (mention === ownerBot)
    return conn.sendMessage(m.chat, { text: 'ⓘ Non puoi rimuovere il creatore del bot' }, { quoted: m })
  if (mention === conn.user.jid)
    return conn.sendMessage(m.chat, { text: 'ⓘ Non puoi rimuovere il bot' }, { quoted: m })
  if (mention === m.sender)
    return conn.sendMessage(m.chat, { text: 'ⓘ Non puoi rimuovere te stesso' }, { quoted: m })

  const utente = participants.find(u => conn.decodeJid(u.id) === mention)
  if (!isSimulation) {
    if (utente?.admin === 'superadmin')
      return conn.sendMessage(m.chat, { text: "ⓘ L'utente è il creatore del gruppo" }, { quoted: m })
    if (utente?.admin === 'admin')
      return conn.sendMessage(m.chat, { text: "ⓘ L'utente è admin" }, { quoted: m })
  }

  const reason = text ? `\n\n𝐌𝐨𝐭𝐢𝐯𝐨: ${text.replace(/@\d+/g, '').trim()}` : ''
  const kickCaption = isSimulation
    ? `🎭 *Simulazione kick*\n\n@${mention.split('@')[0]} sarebbe stato rimosso da @${m.sender.split('@')[0]}${reason}`
    : `👢 @${mention.split('@')[0]} è stato rimosso da @${m.sender.split('@')[0]}${reason}`

  const kickVideoPath = path.join(__dirname, '../../media/gif/kick.mp4')

  try {
    const videoBuffer = fs.readFileSync(kickVideoPath)
    await conn.sendMessage(m.chat, {
      video: videoBuffer,
      gifPlayback: true,
      mimetype: 'video/mp4',
      caption: kickCaption,
      mentions: [mention, m.sender]
    }, { quoted: m })
  } catch (e) {
    console.error('Kick video error:', e.message)
    await conn.sendMessage(m.chat, {
      text: kickCaption,
      mentions: [mention, m.sender]
    }, { quoted: m })
  }

  if (!isSimulation) {
    await conn.groupParticipantsUpdate(m.chat, [mention], 'remove')
  }
}

handler.customPrefix = /^(\.?kick|\.?simkick|rimuovi|sparisci|expulsar|expulsión|expulsar_pt|expulsão|expulser|expulsion|rauswerfen|ausschließen|выгнать|удалить|طرد|إخراج|निकालना|बाहरकाढना|踢出|移除|tendang|keluar|atmak|kovmak)(?=\s|$)/i
handler.command = new RegExp
handler.admin = true
handler.moderator = true

export default handler
