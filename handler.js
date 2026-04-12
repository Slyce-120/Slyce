import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'
import { messageQueue, commandQueue, mediaQueue } from './lib/queue.js'

const { proto } = await import('@whiskeysocket/baileys')

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
  clearTimeout(this)
  resolve()
}, ms))

global.ignoredUsersGlobal = global.ignoredUsersGlobal || new Set()
global.ignoredUsersGroup = global.ignoredUsersGroup || {}
global.groupSpam = global.groupSpam || {}
global.processedMessages = global.processedMessages || new Set()
global.groupMetaCache = global.groupMetaCache || new Map()

const DUPLICATE_WINDOW = 3000
const GROUP_META_CACHE_TTL = 300000
const MEDIA_GIF_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'media', 'gif')
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

function selectQueue(m) {
  if (m.isCommand || (typeof m.text === 'string' && (m.text.startsWith('.') || m.text.startsWith('/')))) return commandQueue
  if (m.mtype?.includes('image') || m.mtype?.includes('video')) return messageQueue
  if (m.mtype?.includes('audio') || m.mtype?.includes('document') || m.mtype?.includes('sticker')) return mediaQueue
  return messageQueue
}

function getJidUser(jid) {
  return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : ''
}

function invalidateGroupMetaCache(chatId) {
  if (!chatId) return
  global.groupMetaCache.delete(chatId)
}

async function getGroupMetadataCached(conn, chatId, { force = false } = {}) {
  const cached = global.groupMetaCache.get(chatId)
  if (!force && cached && Date.now() - cached.timestamp < GROUP_META_CACHE_TTL) {
    return cached.data
  }

  const metadata = await conn.groupMetadata(chatId).catch(() => null)
  if (metadata) {
    global.groupMetaCache.set(chatId, { data: metadata, timestamp: Date.now() })
    return metadata
  }

  return cached?.data || null
}

function normalizePhoneJid(value) {
  if (typeof value !== 'string') return null
  if (value.includes('@')) return value
  const digits = value.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : null
}

function hasAdminRole(participant) {
  return participant?.admin === 'admin' || participant?.admin === 'superadmin'
}

async function getComparableJids(conn, jid, participants = []) {
  const variants = new Set()
  const addCandidate = (value) => {
    if (typeof value !== 'string' || !value) return
    variants.add(value)
    const decoded = conn.decodeJid ? conn.decodeJid(value) : value
    if (typeof decoded === 'string' && decoded) variants.add(decoded)
    const normalized = normalizePhoneJid(value.trim())
    if (normalized) variants.add(normalized)
    const user = getJidUser(value)
    if (user) {
      variants.add(`${user}@lid`)
      variants.add(`${user}@s.whatsapp.net`)
    }
  }

  addCandidate(jid)
  const user = getJidUser(jid)

  const participant = participants.find((entry) => {
    const values = [entry?.id, entry?.jid, entry?.lid, entry?.phoneNumber, entry?.pn, entry?.participantPn]
    return values.some((value) => {
      if (typeof value !== 'string') return false
      const normalized = normalizePhoneJid(value.trim()) || (conn.decodeJid ? conn.decodeJid(value) : value)
      return typeof normalized === 'string' && (variants.has(normalized) || (user && getJidUser(normalized) === user))
    })
  })

  if (participant) {
    addCandidate(participant.id)
    addCandidate(participant.jid)
    addCandidate(participant.lid)
    addCandidate(participant.phoneNumber)
    addCandidate(participant.pn)
    addCandidate(participant.participantPn)
    addCandidate(getParticipantPhoneJid(conn, participant))
  }

  const getPnById = typeof conn.getPNById === 'function'
    ? conn.getPNById.bind(conn)
    : typeof conn.getPNForLID === 'function'
      ? conn.getPNForLID.bind(conn)
      : null
  const getLidById = typeof conn.getLIDById === 'function'
    ? conn.getLIDById.bind(conn)
    : typeof conn.getLIDForPN === 'function'
      ? conn.getLIDForPN.bind(conn)
      : null

  for (const candidate of [...variants]) {
    if (getPnById) {
      try { addCandidate(await getPnById(candidate)) } catch {}
    }
    if (getLidById) {
      try { addCandidate(await getLidById(candidate)) } catch {}
    }
  }

  return variants
}

async function findParticipantByJid(conn, jid, participants = []) {
  if (!jid || !participants.length) return null
  const variants = await getComparableJids(conn, jid, participants)
  const user = getJidUser(jid)

  return participants.find((participant) => {
    const values = [participant?.id, participant?.jid, participant?.lid, participant?.phoneNumber, participant?.pn, participant?.participantPn]
    return values.some((value) => {
      if (typeof value !== 'string') return false
      const normalized = normalizePhoneJid(value.trim()) || (conn.decodeJid ? conn.decodeJid(value) : value)
      return typeof normalized === 'string' && (variants.has(normalized) || (user && getJidUser(normalized) === user))
    })
  }) || null
}

function getParticipantPhoneJid(conn, participant) {
  const lidUser = getJidUser(participant?.lid)
  const directCandidates = [
    participant?.phoneNumber,
    participant?.pn,
    participant?.participantPn,
    participant?.jid,
    participant?.id
  ]

  for (const candidate of directCandidates) {
    const normalized = normalizePhoneJid(typeof candidate === 'string' ? candidate.trim() : '')
    if (!normalized?.endsWith('@s.whatsapp.net')) continue
    if (!lidUser || getJidUser(normalized) !== lidUser) return normalized
  }

  for (const candidate of [participant?.jid, participant?.id]) {
    const normalized = typeof candidate === 'string' ? conn.decodeJid(candidate) : candidate
    if (typeof normalized === 'string' && normalized.endsWith('@s.whatsapp.net')) return normalized
  }

  return participant?.id ? conn.decodeJid(participant.id) : null
}

async function resolveMentionJid(conn, jid, participants = []) {
  if (!jid || typeof jid !== 'string') return jid

  const normalized = conn.decodeJid ? conn.decodeJid(jid) : jid
  const user = getJidUser(jid)
  const candidates = new Set([jid, normalized, `${user}@lid`, `${user}@s.whatsapp.net`].filter(Boolean))

  const match = participants.find(participant => {
    const values = [
      participant?.id,
      participant?.jid,
      participant?.lid,
      participant?.phoneNumber,
      participant?.pn,
      participant?.participantPn
    ]

    for (const value of values) {
      const normalizedValue = normalizePhoneJid(typeof value === 'string' ? value.trim() : '') ||
        (typeof value === 'string' ? conn.decodeJid(value) : value)

      if (typeof normalizedValue === 'string' && candidates.has(normalizedValue)) return true
      if (typeof normalizedValue === 'string' && getJidUser(normalizedValue) === user) return true
    }

    return false
  })

  if (match) return getParticipantPhoneJid(conn, match) || normalized

  const getPnById = typeof conn.getPNById === 'function'
    ? conn.getPNById.bind(conn)
    : typeof conn.getPNForLID === 'function'
      ? conn.getPNForLID.bind(conn)
      : null

  if (getPnById) {
    for (const candidate of candidates) {
      try {
        const resolved = await getPnById(candidate)
        if (resolved) return conn.decodeJid ? conn.decodeJid(resolved) : resolved
      } catch {}
    }
  }

  return normalized
}

export async function handler(chatUpdate) {
  if (!global.db.data.stats) global.db.data.stats = {}
  const stats = global.db.data.stats
  const activePlugins = Object.entries(global.plugins).filter(([, plugin]) => plugin && !plugin.disabled)

  this.msgqueque = this.msgqueque || []
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)
  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  const msgId = m.key?.id
  if (!msgId) return

  if (global.processedMessages.has(msgId)) return
  global.processedMessages.add(msgId)
  setTimeout(() => global.processedMessages.delete(msgId), DUPLICATE_WINDOW)

  if (global.db.data == null) await global.loadDatabase()

  m = smsg(this, m) || m
  if (!m) return

  // ─── Risoluzione LID mentions ───
  if (m.isGroup) {
    const sourceMentions = m.msg?.contextInfo?.mentionedJid || m.mentionedJid || []
    if (sourceMentions.length) {
      try {
        const metaData = await getGroupMetadataCached(this, m.chat)
        const parts = metaData?.participants || []
        const resolved = await Promise.all(sourceMentions.map(jid => resolveMentionJid(this, jid, parts)))
        m.mentionedJid = resolved.filter(Boolean)
        if (typeof m.text === 'string') {
          const resolvedUsers = resolved.map(getJidUser).filter(Boolean)
          let mentionIndex = 0
          m.text = m.text.replace(/@(\d{5,})/g, (full) => {
            const nextUser = resolvedUsers[mentionIndex++]
            return nextUser ? `@${nextUser}` : full
          })
        }
      } catch {}
    }
  }

  for (const [name, plugin] of activePlugins) {
    const __filename = join(___dirname, name)
    if (typeof plugin.all === 'function') {
      try {
        await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename })
      } catch (e) { console.error(`Errore in plugin.all (${name}):`, e) }
    }
  }

  if (m.commandBlocked) return

  const queue = selectQueue(m)
  await queue.add(async () => {
    try { await processMessage.call(this, m, chatUpdate, stats, activePlugins) }
    catch (error) { console.error(`Errore processamento messaggio ${msgId}:`, error.message) }
  }).catch(err => { if (err.message !== 'timeout') console.error('Errore coda:', err) })
}

async function processMessage(m, chatUpdate, stats, activePlugins) {
  try {
    m.exp = 0
    m.limit = false

    try {
      let user = global.db.data.users[m.sender]
      if (typeof user !== 'object') global.db.data.users[m.sender] = {}
      if (user) {
        if (!isNumber(user.messaggi)) user.messaggi = 0
        if (!isNumber(user.blasphemy)) user.blasphemy = 0
        if (!isNumber(user.exp)) user.exp = 0
        if (!isNumber(user.money)) user.money = 0
        if (!isNumber(user.warn)) user.warn = 0
        if (!isNumber(user.joincount)) user.joincount = 2
        if (!('premium' in user)) user.premium = false
        if (!isNumber(user.premiumDate)) user.premiumDate = -1
        if (!('name' in user)) user.name = m.name
        if (!('muto' in user)) user.muto = false
      } else {
        global.db.data.users[m.sender] = {
          messaggi: 0, blasphemy: 0, exp: 0, money: 0, warn: 0,
          joincount: 2, limit: 15000, premium: false, premiumDate: -1,
          name: m.name, muto: false
        }
      }

      let chat = global.db.data.chats[m.chat]
      if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!('isBanned' in chat)) chat.isBanned = false
        if (!('detect' in chat)) chat.detect = true
        if (!('delete' in chat)) chat.delete = false
        if (!('antiLink' in chat)) chat.antiLink = true
        if (!('antiTraba' in chat)) chat.antiTraba = true
        if (!isNumber(chat.expired)) chat.expired = 0
        if (!isNumber(chat.messaggi)) chat.messaggi = 0
        if (!('name' in chat)) chat.name = this.getName(m.chat)
        if (!('antispamcomandi' in chat)) chat.antispamcomandi = true
        if (!('welcome' in chat)) chat.welcome = true
        if (!('bye' in chat)) chat.bye = 'welcome' in chat ? !!chat.welcome : true
        if (!Array.isArray(chat.moderators)) chat.moderators = []
      } else {
        global.db.data.chats[m.chat] = {
          name: this.getName(m.chat), isBanned: false, detect: true,
          delete: false, antiLink: true, antiTraba: true, expired: 0,
          messaggi: 0, antispamcomandi: true, welcome: true, bye: true,
          moderators: []
        }
      }

      let settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!('self' in settings)) settings.self = false
        if (!('autoread' in settings)) settings.autoread = false
        if (!('restrict' in settings)) settings.restrict = true
      } else {
        global.db.data.settings[this.user.jid] = { self: false, autoread: false, restrict: true }
      }
    } catch (e) { console.error(e) }

    if (opts['nyimak']) return
    if (!m.fromMe && opts['self']) return
    if (opts['pconly'] && m.chat.endsWith('g.us')) return
    if (opts['gconly'] && !m.chat.endsWith('g.us')) return

    if (typeof m.text !== 'string') m.text = ''

    const isROwner = [this.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)]
      .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
      .includes(m.sender)
    const isOwner2 = isROwner || m.fromMe
    const isMods = isOwner2 || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
    const isPrems = isROwner || isOwner2 || isMods || global.db.data.users[m.sender]?.premiumTime > 0

    if (opts['queque'] && m.text && !(isMods || isPrems)) {
      let queque = this.msgqueque, time = 1000 * 5
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      setInterval(async function () {
        if (queque.indexOf(previousID) === -1) clearInterval(this)
        await delay(time)
      }, time)
    }

    if (m.isBaileys) return
    m.exp += Math.ceil(Math.random() * 10)

    let usedPrefix
    let _user = global.db.data?.users?.[m.sender]

    let groupMetadata = {}
    if (m.isGroup) {
      groupMetadata = (await getGroupMetadataCached(this, m.chat)) || {}
    }

    let participants = (m.isGroup ? groupMetadata.participants : []) || []
    let normalizedParticipants = participants.map(u => {
      const normalizedId = this.decodeJid(u.id)
      return { ...u, id: normalizedId, jid: u.jid || normalizedId }
    })
    let user = (m.isGroup ? await findParticipantByJid(this, m.sender, normalizedParticipants) : {}) || {}
    let bot = (m.isGroup ? await findParticipantByJid(this, this.user.jid, normalizedParticipants) : {}) || {}
    let isRAdmin = user?.admin == 'superadmin' || false
    let isAdmin = m.isGroup ? hasAdminRole(user) : false
    let isBotAdmin = m.isGroup ? hasAdminRole(bot) : false
    let isModerator = m.isGroup ? (isAdmin || isOwner2 || (global.db.data.chats[m.chat]?.moderators || []).includes(m.sender)) : false

    if (m.isGroup && (!user || !bot)) {
      const freshMetadata = await getGroupMetadataCached(this, m.chat, { force: true })
      const freshParticipants = freshMetadata?.participants || []
      if (freshParticipants.length) {
        groupMetadata = freshMetadata
        participants = freshParticipants
        normalizedParticipants = freshParticipants.map(u => {
          const normalizedId = this.decodeJid(u.id)
          return { ...u, id: normalizedId, jid: u.jid || normalizedId }
        })
        user = (await findParticipantByJid(this, m.sender, normalizedParticipants)) || {}
        bot = (await findParticipantByJid(this, this.user.jid, normalizedParticipants)) || {}
        isRAdmin = user?.admin == 'superadmin' || false
        isAdmin = hasAdminRole(user)
        isBotAdmin = hasAdminRole(bot)
        isModerator = isAdmin || isOwner2 || (global.db.data.chats[m.chat]?.moderators || []).includes(m.sender)
      }
    }

    if (m.commandBlocked) return

    for (const [name, plugin] of activePlugins) {
      const __filename = join(___dirname, name)
      if (!opts['restrict'] && plugin.tags?.includes('admin')) continue
      if (typeof plugin.before === 'function') {
        try {
          const shouldContinue = await plugin.before.call(this, m, {
            conn: this, participants: normalizedParticipants, groupMetadata,
            user, bot, isROwner, isOwner: isOwner2, isRAdmin, isAdmin,
            isBotAdmin, isModerator, isPrems, chatUpdate, __dirname: ___dirname, __filename
          })
          if (shouldContinue) continue
        } catch (e) { console.error(`Errore in plugin.before (${name}):`, e) }
      }
    }

    for (const [name, plugin] of activePlugins) {
      const __filename = join(___dirname, name)
      if (!opts['restrict'] && plugin.tags?.includes('admin')) continue

      const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
      let match = (_prefix instanceof RegExp ?
        [[_prefix.exec(m.text), _prefix]] :
        Array.isArray(_prefix) ?
          _prefix.map(p => { let re = p instanceof RegExp ? p : new RegExp(str2Regex(p)); return [re.exec(m.text), re] }) :
          typeof _prefix === 'string' ?
            [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
            [[[], new RegExp]]
      ).find(p => p[1])

      if (typeof plugin !== 'function') continue
      if (!match) continue

      if ((usedPrefix = (match[0] || '')[0])) {
        let noPrefix = m.text.replace(usedPrefix, '')
        let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
        args = args || []
        let _args = noPrefix.trim().split` `.slice(1)
        let text = _args.join` `
        command = (command || '').toLowerCase()
        let fail = plugin.fail || global.dfail
        let isAccept = plugin.command instanceof RegExp ?
          plugin.command.test(command) :
          Array.isArray(plugin.command) ?
            plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
            typeof plugin.command === 'string' ? plugin.command === command : false

        if (!isAccept) continue

        m.plugin = name
        if ((m.chat in global.db.data.chats || m.sender in global.db.data.users)) {
          let chat = global.db.data.chats[m.chat]
          let userDb = global.db.data.users[m.sender]
          if (name != 'owner-unbanchat.js' && chat?.isBanned) return
          if (name != 'owner-unbanuser.js' && userDb?.banned) return
        }

        let chatDb = global.db.data.chats[m.chat]
        let adminMode = chatDb?.soloadmin
        let mystica = `${plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || _prefix || m.text.slice(0, 1) == _prefix || plugin.command}`
        if (adminMode && !isOwner2 && !isROwner && m.isGroup && !isAdmin && !isModerator && mystica) return

        if (plugin.rowner && plugin.owner && !(isROwner || isOwner2)) { fail('owner', m, this); continue }
        if (plugin.rowner && !isROwner) { fail('rowner', m, this); continue }
        if (plugin.owner && !isOwner2) { fail('owner', m, this); continue }
        if (plugin.mods && !isMods) { fail('mods', m, this); continue }
        if (plugin.premium && !isPrems) { fail('premium', m, this); continue }
        if (plugin.moderator && !isModerator) { fail('moderator', m, this); continue }
        if (plugin.group && !m.isGroup) { fail('group', m, this); continue }
        else if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, this); continue }
        else if (plugin.admin && !isAdmin && !(plugin.moderator && isModerator)) { fail('admin', m, this); continue }
        if (plugin.private && m.isGroup) { fail('private', m, this); continue }
        if (plugin.register == true && _user?.registered == false) { fail('unreg', m, this); continue }

        m.isCommand = true
        let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
        if (xp > 2000) m.reply('Exp limit')
        else if (plugin.money && global.db.data.users[m.sender]?.money < plugin.money * 1) { fail('senzasoldi', m, this); continue }
        m.exp += xp

        if (!isPrems && plugin.limit && global.db.data.users[m.sender]?.limit < plugin.limit * 1) continue
        if (plugin.level > _user?.level) { this.reply(m.chat, `livello troppo basso`, m); continue }

        let extra = {
          match, usedPrefix, noPrefix, _args, args, command, text,
          conn: this, normalizedParticipants, participants, groupMetadata,
          user, bot, isROwner, isOwner: isOwner2, isRAdmin, isAdmin,
          isBotAdmin, isModerator, isPrems, chatUpdate, __dirname: ___dirname, __filename,
          mentionedJid: m.mentionedJid || []
        }

        try {
          await plugin.call(this, m, extra)
          if (!isPrems) {
            m.limit = m.limit || plugin.limit || false
            m.money = m.money || plugin.money || false
          }
        } catch (e) {
          m.error = e
          console.error(e)
          if (e) {
            let textErr = format(e)
            for (let key of Object.values(global.APIKeys || {}))
              textErr = textErr.replace(new RegExp(key, 'g'), '#HIDDEN#')
            m.reply(textErr)
          }
        } finally {
          if (typeof plugin.after === 'function') {
            try { await plugin.after.call(this, m, extra) }
            catch (e) { console.error(`Errore in plugin.after (${name}):`, e) }
          }
        }
        break
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    if (opts['queque'] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
    }

    if (m?.sender) {
      let user = global.db.data.users[m.sender]
      let chat = global.db.data.chats[m.chat]
      const isMutedHere = user && (user.muto === true || (typeof user.muto === 'object' && user.muto?.[m.chat]))
      if (isMutedHere) {
        await this.sendMessage(m.chat, {
          delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }
        }).catch(console.error)
      }
      if (user) {
        user.exp += m.exp
        user.limit -= m.limit * 1
        user.money -= m.money * 1
        user.messaggi += 1
      }
      if (chat) chat.messaggi += 1
    }

    if (m?.plugin) {
      let now = +new Date
      if (!stats[m.plugin]) stats[m.plugin] = { total: 0, success: 0, last: 0, lastSuccess: 0 }
      const stat = stats[m.plugin]
      stat.total += 1
      stat.last = now
      if (!m.error) { stat.success += 1; stat.lastSuccess = now }
    }

    if (typeof global.markDbDirty === 'function') {
      global.markDbDirty()
    }

    try {
      if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
    } catch (e) { console.log(m, m.quoted, e) }
    if (opts['autoread']) await this.readMessages([m.key])
  }
}

export async function participantsUpdate({ id, participants, action }) {
  if (opts['self']) return
  if (this.isInit) return
  if (global.db.data == null) await global.loadDatabase()
  invalidateGroupMetaCache(id)

  let chat = global.db.data.chats[id] || {}
  let text = ''

  switch (action) {
    case 'add':
    case 'remove':
      if ((action === 'add' && chat.welcome) || (action === 'remove' && chat.bye)) {
        let groupMetadata = await this.groupMetadata(id).catch(() => (this.chats[id] || {}).metadata || {})
        for (let user of participants) {
          if (action === 'add') {
            text = (chat.sWelcome || this.welcome || 'benvenuto, @user!')
              .replace('@subject', await this.getName(id))
              .replace('@desc', groupMetadata.desc?.toString() || '')
              .replace('@user', '@' + user.split('@')[0])
          } else if (action === 'remove') {
            text = (chat.sBye || this.bye || 'bye bye, @user!')
              .replace('@user', '@' + user.split('@')[0])
          }

          const mediaName = action === 'add' ? 'welcome.mp4' : 'addio.mp4'
          const mediaPath = path.join(MEDIA_GIF_DIR, mediaName)

          if (fs.existsSync(mediaPath)) {
            const videoBuffer = fs.readFileSync(mediaPath)
            await this.sendMessage(id, {
              video: videoBuffer,
              gifPlayback: true,
              mimetype: 'video/mp4',
              caption: text,
              mentions: [user]
            }).catch(console.error)
            continue
          }

          await this.sendMessage(id, {
            text,
            mentions: [user]
          }).catch(console.error)
        }
      }
      break
  }
}

export async function groupsUpdate(groupsUpdate) {
  if (opts['self']) return
  for (const groupUpdate of groupsUpdate) {
    const id = groupUpdate.id
    if (!id) continue
    invalidateGroupMetaCache(id)
    let chats = global.db.data.chats[id] || {}
    let text = ''
    if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || '`immagine modificata`').replace('@icon', groupUpdate.icon)
    if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || '`link reimpostato, nuovo link:`\n@revoke').replace('@revoke', groupUpdate.revoke)
    if (!text) continue
    await this.sendMessage(id, { text, mentions: this.parseMention(text) }).catch(console.error)
  }
}

export async function callUpdate(callUpdate) {
  let isAnticall = global.db.data.settings?.[this.user.jid]?.antiCall
  if (!isAnticall) return
  for (let nk of callUpdate) {
    if (!nk.isGroup && nk.status === 'offer') {
      let callmsg = await this.reply(nk.from, `ciao @${nk.from.split('@')[0]}, c'è anticall.`, false, { mentions: [nk.from] }).catch(console.error)
      let vcard = `BEGIN:VCARD\nVERSION:5.0\nN:;𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲;;;\nFN:𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲\nORG:𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲\nTITLE:\nitem1.TEL;waid=393773842461:+39 3515533859\nitem1.X-ABLabel:𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲\nX-WA-BIZ-DESCRIPTION:ofc\nX-WA-BIZ-NAME:𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲\nEND:VCARD`
      await this.sendMessage(nk.from, { contacts: { displayName: 'Unlimited', contacts: [{ vcard }] } }, { quoted: callmsg }).catch(console.error)
      await this.updateBlockStatus(nk.from, 'block').catch(console.error)
    }
  }
}

export async function deleteUpdate(message) {
  try {
    const { fromMe, id } = message
    if (fromMe) return
    let msg = this.serializeM(this.loadMessage(id))
    if (!msg) return
  } catch (e) { console.error(e) }
}

global.dfail = (type, m, conn) => {
  let msg = {
    rowner: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐬𝐨𝐥𝐨 𝐩𝐞𝐫 𝐨𝐰𝐧𝐞𝐫 🕵🏻‍♂️',
    owner: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐬𝐨𝐥𝐨 𝐩𝐞𝐫 𝐨𝐰𝐧𝐞𝐫 🕵🏻‍♂️',
    mods: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐥𝐨 𝐩𝐨𝐬𝐬𝐨𝐧𝐨 𝐮𝐭𝐢𝐥𝐢𝐳𝐳𝐚𝐫𝐞 𝐬𝐨𝐥𝐨 𝐚𝐝𝐦𝐢𝐧 𝐞 𝐨𝐰𝐧𝐞𝐫 ⚙️',
    premium: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐩𝐞𝐫 𝐦𝐞𝐦𝐛𝐫𝐢 𝐩𝐫𝐞𝐦𝐢𝐮𝐦 ✅',
    group: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐩𝐮𝐨𝐢 𝐮𝐭𝐢𝐥𝐢𝐳𝐳𝐚𝐫𝐥𝐨 𝐢𝐧 𝐮𝐧 𝐠𝐫𝐮𝐩𝐩𝐨 👥',
    private: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐩𝐮𝐨𝐢 𝐮𝐭𝐢𝐥𝐢𝐧𝐢𝐭𝐚𝐫𝐥𝐨 𝐢𝐧 𝐜𝐡𝐚𝐭 𝐩𝐫𝐢𝐯𝐚𝐭𝐚 👤',
    admin: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐩𝐞𝐫 𝐬𝐨𝐥𝐢 𝐚𝐝𝐦𝐢𝐧 👑',
    moderator: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐩𝐞𝐫 𝐦𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐢 🛡️',
    botAdmin: '𝐃𝐞𝐯𝐢 𝐝𝐚𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐚𝐥 𝐛𝐨𝐭 👑',
    restrict: '🔐 𝐑𝐞𝐬𝐭𝐫𝐢𝐜𝐭 𝐞 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨 🔐'
  }[type]
  if (msg) return conn.sendMessage(m.chat, {
    text: ' ',
    contextInfo: {
      externalAdReply: {
        title: `${msg}`,
        body: '',
        previewType: 'PHOTO',
        thumbnail: fs.readFileSync('./media/principale.jpeg'),
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

const file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})
