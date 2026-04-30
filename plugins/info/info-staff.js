//plugin by Giuse
let handler = async (m, { conn }) => {

    // Newsletter globale ChatUnity
    const cuContext = {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363259442839354@newsletter',
            serverMessageId: 100,
            newsletterName: `𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻 ✦ Staff Ufficiale`
        }
    };

    // Schede di contatto (vCard)
    const vcards = [
        { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;𝑺𝑳𝒀𝑪𝑬 | CEO;;;\nFN: | CEO\nORG:𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻\nTITLE:CEO\nitem1.TEL;waid=12368910153:+1 236 891 0153\nitem1.X-ABLabel:Cellulare\nEND:VCARD` },
        { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Dieh;;;\nFN:Dieh\nORG:𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻\nTITLE:Staff\nitem1.TEL;waid=393892016995:+39 389 201 6995\nitem1.X-ABLabel:Cellulare\nEND:VCARD` },
    ];

    // Testo elegante con i numeri in chiaro
    let testo = `
୧・︶ ✦ ꪶ𖣘ꫂ𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻ꪶ𖣘ꫂ ✦ ︶・୨
꒷꒦ ‧₊ 🛡️ 𝐒 𝐓 𝐀 𝐅 𝐅 🛡️ ₊‧ ꒷꒦
୧・︶ : ︶ : ︶ : ︶ : ︶ : ︶・୨

✦ 👑 +1 (236) 891 0153 ~ 𝑺𝑳𝒀𝑪𝑬 |CEO|



👑 _Il team dietro 𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻._
୧・︶ : ︶ ꒷꒦ ‧₊ ୧`.trim();

    // 1. Invia le schede contatto (rubrica)
    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: 'Staff 𝑺𝑳𝒀𝑪𝑬 𝑩𝑶𝑻',
            contacts: vcards
        },
        contextInfo: cuContext
    }, { quoted: m });

    // 2. Invia il testo stilizzato
    await conn.sendMessage(m.chat, {
        text: testo,
        contextInfo: cuContext
    });

};

handler.help = ['staff', 'owner', 'creatori'];
handler.tags = ['info'];
handler.command = /^(staff|owner|creatori|founder)$/i;

export default handler;
