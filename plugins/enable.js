import fs from 'fs'
import fetch from 'node-fetch'

const features = [
  { key: 'antiLink',        label: 'AntiLink' },
  { key: 'antiLinkHard',    label: 'Antilinkhard' },
  { key: 'antimedia',       label: 'Antimedia' },
  { key: 'antispamcomandi', label: 'AntispamComandi' },
  { key: 'welcome',         label: 'Benvenuto' },
  { key: 'bye',             label: 'Addio' },
  { key: 'autosticker',     label: 'Autosticker' },
  { key: 'antibot',         label: 'Antibot' },
  { key: 'detect',          label: 'Detect' },
  { key: 'risposte',        label: 'Risposte' },
  { key: 'gpt',             label: 'GPT' },
  { key: 'antispam',        label: 'Antispam' },
  { key: 'antiviewonce',    label: 'Antiviewonce' },
  { key: 'sologruppo',      label: 'SoloGruppo' },
  { key: 'soloprivato',     label: 'SoloPrivato' },
  { key: 'soloadmin',       label: 'soloadmin' },
  { key: 'isBanned',        label: 'BanGruppo' },
  { key: 'antinuke',        label: 'AntiNuke' },
  { key: 'conclave',        label: 'Conclave' },
  { key: 'antiCall',        label: 'AntiCall' },
  { key: 'antiinsta',       label: 'Antiinsta' },
  { key: 'antiporno',       label: 'Antiporno' },
  { key: 'antitrava',       label: 'Antitrava' },
  { key: 'antivirus',       label: 'Antivirus' },
  { key: 'antivoip',        label: 'Antivoip' },
  { key: 'antiArab',        label: 'Antiarab' },
  { key: 'antisondaggi',    label: 'Antisondaggi' },
  { key: 'antitiktok',      label: 'AntiTikTok' },
  { key: 'chatbotPrivato',  label: 'ChatbotPrivato', ownerOnly: true },
  { key: 'bestemmiometro',      label: 'Bestemmiometro' },
]

let handler = async (m, { conn, command, args, isOwner, isROwner }) => {
  const chats = global.db?.data?.chats || {}
  const chatData = chats[m.chat] || {}

  const featureArg = (args[0] || '').toLowerCase()
  const selected = features.find(f => f.label.toLowerCase() === featureArg)

  if (!featureArg || !selected) {
    const list = features.map(f => `୧ *${f.label}*`).join('\n')
    const msg = featureArg
      ? `『 ❌ 』 Funzione *"${featureArg}"* non trovata.\n\n꒷꒦ ✦ Funzioni disponibili ✦ ꒷꒦\n${list}`
      : `『 ❗ 』 Specifica una funzione.\n\n꒷꒦ ✦ Funzioni disponibili ✦ ꒷꒦\n${list}`
    return conn.reply(m.chat, msg, m)
  }

  if (selected.ownerOnly && !(isOwner || isROwner)) {
    return conn.reply(m.chat, '『 🔒 』 Solo il proprietario può usare questa funzione.', m)
  }

  const isEnable = /^(attiva|enable|on|1|true|si|yes|activar|activer|aktivieren|启用|включить|تفعيل|सक्षम|aktifkan|etkinleştir)$/i.test(command)
  const setTo = isEnable

  if (selected.key === 'antivoip') {
    chatData.antivoip = setTo
  } else if (selected.key === 'chatbotPrivato') {
    if (m.isGroup) return conn.reply(m.chat, '『 ❌ 』 Puoi usare *ChatbotPrivato* solo in chat privata.', m)
    if (!global.privateChatbot) global.privateChatbot = {}
    global.privateChatbot[m.sender] = setTo
  } else {
    chatData[selected.key] = setTo
  }

  if (global.db?.data?.chats) global.db.data.chats[m.chat] = chatData

  const stateIcon = (selected.key === 'chatbotPrivato'
    ? (global.privateChatbot?.[m.sender] ? '🟢' : '🔴')
    : (chatData[selected.key] ? '🟢' : '🔴'))

  const stateVerb = setTo ? '𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚' : '𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚'

  await conn.reply(m.chat, `╭★────★────★
│ ꒰¡𝐒𝐓𝐀𝐓𝐎 𝐅𝐔𝐍𝐙𝐈𝐎𝐍𝐄!꒱
│
│˚₊꒷ ${stateIcon} ꒱ ฅ﹕*${selected.label}* ${stateVerb} ₊˚๑
╰★────★────★`, m)
}

handler.help = ['attiva <feature>', 'disabilita <feature>', 'disattiva <feature>']
handler.tags = ['impostazioni', 'owner']
handler.command = /^(attiva|disabilita|disattiva|on|off|enable|disable|activar|desactivar|activer|désactiver|aktivieren|deaktivieren|启用|禁用|включить|отключить|تفعيل|تعطيل|सक्षम|अक्षम|aktifkan|nonaktifkan|etkinleştir|etkisizleştir|1|0|true|false|si|no|yes)$/i
handler.group = true
handler.ownerOnly = false

export default handler
