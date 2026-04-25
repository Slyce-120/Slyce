import pkg from '@chatunity/baileys'
const { generateWAMessageFromContent } = pkg

let handler = async (m, { conn }) => {
  const ownerNumber = '393773842461'
  const ownerName = 'vale'
  const nomebot = conn.user?.name || global.db?.data?.nomedelbot || global.nomebot || 'ChatUnity'

  await conn.sendContact(m.chat, [[ownerNumber, ownerName]], m)

  let msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: "I miei social" },
          body: { text: "Puoi contattarmi anche qua: 👇" },
          footer: { text: nomebot },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "『 💻 』 GitHub",
                  url: "https://github.com/chatunitycenter",
                  merchant_url: "https://github.com/chatunitycenter"
                })
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "『 📸 』 Instagram",
                  url: "https://instagram.com/yyktv.vale",
                  merchant_url: "https://instagram.com/yyktv.vale"
                })
              }
            ]
          }
        }
      }
    }
  }, { userJid: m.sender })

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}
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