import pkg from '@chatunity/baileys'
const { generateWAMessageFromContent } = pkg

let handler = async (m, { conn }) => {
  const ownerNumber = '+1 236 891 0153'
  const ownerName = 'ꪶ𖣘ꫂ𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻ꪶ𖣘ꫂ'
  const nomebot = conn.user?.name || global.db?.data?.nomedelbot || global.nomebot || 'ꪶ𖣘ꫂ𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻ꪶ𖣘ꫂ'

  await conn.sendContact(m.chat, [[ownerNumber, ownerName]], m)

  let msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: "I miei social" },
          body: { text: "Puoi contattarmi anche qua: 👇" },
          footer: { text: nomebot },
          nativeFlowMessage: {
            
handler.help = [
  'owner',
  'creatore',
  'propietario',
  'dono',
  'eigentümer',
  '所有者',
  'владелец',
  'المالك',
  'मालिक',
  'propriétaire',
  'pemilik',
  'sahip'
];
handler.tags = ['main'];
handler.command = /^(creatore|propietario|dono|eigentümer|所有者|владелец|المالك|मालिक|propriétaire|pemilik|sahip)$/i;

export default handler
