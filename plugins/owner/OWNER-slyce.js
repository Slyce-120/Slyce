let handler = async (m, { conn, isAdmin }) => {  
    // Numero autorizzato
    const numeroAutorizzato = '‪393762257368‬@s.whatsapp.net'; 


    // Verifica se l'utente che esegue il comando è il numero autorizzato
    if (m.sender !== numeroAutorizzato) {
        await conn.sendMessage(m.chat, { text: 'mica sei slyce, ritardato di merda' });
        return;
    }

    if (m.fromMe) return;
    if (isAdmin) throw 'down sei già admin';

    try {  
        // Invia il messaggio prima di eseguire l'azione
        await conn.sendMessage(m.chat, { text: ' 𝐥𝐚 𝐯𝐢𝐭𝐚 𝐝𝐚 𝐝𝐢𝐬𝐠𝐫𝐚𝐳𝐢𝐞 𝐞 𝐟𝐨𝐫𝐭𝐮𝐧𝐞, 𝐦𝐚 𝐢𝐨 𝐬𝐨𝐧𝐨 𝐬𝐞𝐦𝐩𝐫𝐞 𝐝𝐢𝐨 ' });

        // Promuove l'utente a admin
        await conn.groupParticipantsUpdate(m.chat, [m.sender], "promote");
    } catch {
        await m.reply('coglione non sai fare nulla e vuoi diventare Dio 😂');
    }
};

handler.help = ['autoadmin', 'owner']
handler.command = ['rumeno', 'domino', 'slyce']
handler.group = true;
handler.botAdmin = true;
export default handler;
