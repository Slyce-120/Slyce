let handler = async (m, { conn, isAdmin }) => {  
if (m.fromMe) return
if (isAdmin) throw 'ok'
try {  
await conn.groupParticipantsUpdate(m.chat, [m.sender], "promote")
} catch {
await m.reply('non ti è concesso')}}
handler.command = /^slyce$/i
handler.rowner = true
handler.group = true
handler.botAdmin = true
export default handler
