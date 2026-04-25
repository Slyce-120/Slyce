import os from 'os'
import util from 'util'
import sizeFormatter from 'human-readable'
import MessageType from '@chatunity/baileys'
import fs from 'fs'
import { performance } from 'perf_hooks'
import '../../lib/language.js'

const ims = './bb.jpg'

let handler = async (m, { conn, usedPrefix }) => {
    const userId = m.sender
    const groupId = m.isGroup ? m.chat : null
    const nomeDelBot = global.db.data.nomedelbot || 'ChatUnity'
    
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime) 
    let totalreg = Object.keys(global.db.data.users).length
    const chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
    const groupsIn = chats.filter(([id]) => id.endsWith('@g.us'))
    const groups = chats.filter(([id]) => id.endsWith('@g.us'))
    const used = process.memoryUsage()
    const { restrict } = global.db.data.settings[conn.user.jid] || {}
    const { autoread } = global.opts
    let old = performance.now()
    let neww = performance.now()
    let speed = (neww - old).toFixed(4)

    const title = global.t('installTitle', userId, groupId)
    const intro = global.t('installIntro', userId, groupId)
    const description = global.t('installDescription', userId, groupId)
    const guideLabel = global.t('installGuideLabel', userId, groupId)
    const repoLabel = global.t('installRepoLabel', userId, groupId)
    const videoLabel = global.t('installVideoLabel', userId, groupId)
    const features = global.t('installFeatures', userId, groupId)
    const feature1 = global.t('installFeature1', userId, groupId)
    const feature2 = global.t('installFeature2', userId, groupId)
    const feature3 = global.t('installFeature3', userId, groupId)
    const feature4 = global.t('installFeature4', userId, groupId)
    const cta = global.t('installCTA', userId, groupId)
    const needHelp = global.t('installNeedHelp', userId, groupId)

    let info = `
${title}

${intro}

${description}

${features}

•   ${feature1}
•   ${feature2}
•   ${feature3}
•   ${feature4}

${cta}
꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧
୧ ${repoLabel}
[https://github.com/chatunitycenter/chatunity-bot](https://github.com/chatunitycenter/chatunity-bot)

୧ ${videoLabel}
[https://youtu.be/-FZYK-vj4BY](https://youtu.be/-FZYK-vj4BY)
꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧

> ${needHelp}

╰♡꒷ ๑ ⋆˚₊⋆───ʚ˚ɞ───⋆˚₊⋆ ๑ ⪩
୧・𝐂𝐎𝐋𝐋𝐀𝐁: ${collab}
୧・© ChatUnity Bot
╰♡꒷ ๑ ⋆˚₊⋆───ʚ˚ɞ───⋆˚₊⋆ ๑ ⪩
`.trim()

    await conn.sendMessage(m.chat, {
        text: info,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363259442839354@newsletter',
                serverMessageId: '',
                newsletterName: `${nomeDelBot}`
            },
            externalAdReply: {
                mediaUrl: null,
                mediaType: 1,
                description: null,
                title: '𝙸𝙽𝙵𝙾 𝙳𝙴𝙻 𝙱𝙾𝚃',
                body: 'ChatUnity',
                previewType: 0,
                thumbnail: fs.readFileSync("./media/principale.jpeg"),
                sourceUrl: `https://github.com/chatunitycenter/chatunity-bot`
            }
        }
    }, { quoted: m })
}

handler.help = [
  'install',
  'download',
  'installa',
  'scarica',
  'instalar',
  'descargar',
  'instalar_pt',
  'baixar',
  'installieren',
  'herunterladen',
  '安装',
  '下载',
  'установить',
  'скачать',
  'تثبيت',
  'تحميل',
  'इंस्टॉल',
  'डाउनलोड',
  'installer',
  'télécharger',
  'pasang',
  'unduh',
  'yükle',
  'indir'
];
handler.tags = ['info', 'tools'];
handler.command = /^(install|download|installa|scarica|instalar|descargar|instalar_pt|baixar|installieren|herunterladen|安装|下载|установить|скачать|تثبيت|تحميل|इंस्टॉल|डाउनलोड|installer|télécharger|pasang|unduh|yükle|indir)$/i;


export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    console.log({ms,h,m,s})
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
