let handler = async (m, { conn, isROwner }) => {
  if (!m.isGroup) return await conn.reply(m.chat, 'Questo comando funziona solo nei gruppi.', m)

  const userId = m.sender
  const groupId = m.chat
  const botJid = conn.user?.jid || conn.user?.id || ''

  try {
    const metadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!metadata) return await conn.reply(m.chat, 'Impossibile recuperare i dati del gruppo.', m)

    const oldTitle = metadata.subject || 'FALLITI'
    const newTitle = `${oldTitle} | 𝐒𝐕𝐓 𝐁𝐘 ✧ 𝐃𝐈𝐄𝐇 ✧`
    await conn.groupUpdateSubject(m.chat, newTitle)

    await conn.sendMessage(m.chat, { text: '« 𝑻𝑨𝑮𝑳𝑰𝑨𝑴𝑶 𝑰 𝑽𝑶𝑺𝑻𝑹𝑰 𝑳𝑬𝑮𝑨𝑴𝑰 𝑬 𝑪𝑨𝑵𝑪𝑬𝑳𝑳𝑰𝑨𝑴𝑶 𝑳𝑨 𝑽𝑶𝑺𝑻𝑹𝑨 𝑬𝑺𝑰𝑺𝑻𝑬𝑵𝒁𝑨, 𝑺𝑷𝑬𝑹𝑨𝑻𝑬 𝑷𝑬𝑹 𝑽𝑶𝑰 𝑫𝑰 𝑬𝑺𝑺𝑬𝑹𝑬 𝑨𝑩𝑩𝑨𝑺𝑻𝑨𝑵𝒁𝑨 𝑫𝑬𝑮𝑵𝑰 𝑷𝑬𝑹 𝑪𝑶𝑺𝑨 𝑽𝑰 𝑨𝑺𝑷𝑬𝑻𝑻𝑬𝑹𝑨̀’. »' }, { quoted: m })

    const mentions = metadata.participants
      .filter(participant => participant.id !== botJid)
      .map(participant => participant.id)

    await conn.sendMessage(
      m.chat,
      {
        text: '« 𝑨𝑫𝑬𝑺𝑺𝑶 𝑳𝑨𝑺𝑪𝑰𝑨𝑻𝑬 𝑨𝑵𝑫𝑨𝑹𝑬 𝑰𝑳 𝑷𝑨𝑺𝑺𝑨𝑻𝑶 𝑬 𝑨𝑪𝑪𝑬𝑻𝑻𝑨𝑻𝑬 𝑪𝑶𝑴𝑬 𝑺𝑰𝑨𝑵𝑶 𝑨𝑵𝑫𝑨𝑻𝑬 𝑳𝑬 𝑪𝑶𝑺𝑬, 𝑬 𝑴𝑰 𝑹𝑨𝑪𝑪𝑶𝑴𝑨𝑵𝑫𝑶 𝑬𝑵𝑻𝑹𝑨𝑻𝑬 𝑸𝑼𝑰 \nhttps://chat.whatsapp.com/CUMqocujk3FIQ6AXC9fonl?mode=gi_t »',
        mentions
      },
      { quoted: m }
    )

    const participantsToRemove = metadata.participants
      .filter(participant => participant.id !== m.sender)
      .map(participant => participant.id)

    if (participantsToRemove.length > 0) {
      try {
        await conn.groupParticipantsUpdate(m.chat, participantsToRemove, 'remove')
      } catch (error) {
        console.error('Errore kick partecipanti:', error)
      }
    }

    await conn.sendMessage(m.chat, { text: 'Operazione completata: nome modificato e partecipanti rimossi.' }, { quoted: m })
  } catch (error) {
    console.error(error)
    await conn.reply(m.chat, 'Errore durante l’esecuzione di .afterlight.', m)
  }
} 
handler.help = ['nuke']
handler.tags = ['owner']
handler.command = /^(kaos|nuke|slycedomina)$/i
handler.group = true
handler.botAdmin = true
handler.rowner = true

export default handler
