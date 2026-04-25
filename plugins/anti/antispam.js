//Plugin antispam fixxed by dieh github.com/watted90 
let userSpamCounters = {};
const STICKER_LIMIT = 6, PHOTO_VIDEO_LIMIT = 13, RESET_TIMEOUT = 5000;

export async function before(m, { isAdmin, isBotAdmin, conn }) {
    if (m.isBaileys && m.fromMe) return true;
    if (!m.isGroup) return false;

    let bot = global.db.data.settings[this.user.jid] || {};
    const sender = m.sender;
    const userId = m.sender;
    const groupId = m.chat;

    if (!userSpamCounters[m.chat]) userSpamCounters[m.chat] = {};
    if (!userSpamCounters[m.chat][sender]) {
        userSpamCounters[m.chat][sender] = { 
            stickerCount: 0, 
            photoVideoCount: 0, 
            messageIds: [], 
            lastMessageTime: 0, 
            timer: null 
        };
    }

    const counter = userSpamCounters[m.chat][sender];
    const currentTime = Date.now();
    const isSticker = m.message?.stickerMessage;
    const isPhoto = m.message?.imageMessage || m.message?.videoMessage;

    if (isSticker || isPhoto) {
        if (isSticker) counter.stickerCount++;
        else if (isPhoto) counter.photoVideoCount++;

        counter.messageIds.push(m.key.id);
        counter.lastMessageTime = currentTime;

        if (counter.timer) clearTimeout(counter.timer);

        const isStickerSpam = counter.stickerCount >= STICKER_LIMIT;
        const isPhotoVideoSpam = counter.photoVideoCount >= PHOTO_VIDEO_LIMIT;

        if (isStickerSpam || isPhotoVideoSpam) {
            if (isBotAdmin && bot.restrict) {
                try {
                    await conn.groupSettingUpdate(m.chat, 'announcement');
                    
                    if (!isAdmin) {
                        await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
                    }

                    for (const messageId of counter.messageIds) {
                        await conn.sendMessage(m.chat, { 
                            delete: { 
                                remoteJid: m.chat, 
                                fromMe: false, 
                                id: messageId, 
                                participant: m.key.participant 
                            } 
                        });
                    }

                    await conn.groupSettingUpdate(m.chat, 'not_announcement');
                    await conn.sendMessage(m.chat, { 
                        text: global.t('antiSpamDetected', userId, groupId)
                    });
                    
                    delete userSpamCounters[m.chat][sender];

                } catch (error) {
                    console.error('Errore durante la gestione dello spam:', error);
                }
            }
        } else {
            counter.timer = setTimeout(() => {
                delete userSpamCounters[m.chat][sender];
            }, RESET_TIMEOUT);
        }
    } else {
        if (currentTime - counter.lastMessageTime > RESET_TIMEOUT && 
            (counter.stickerCount > 0 || counter.photoVideoCount > 0)) {
            delete userSpamCounters[m.chat][sender];
        }
    }

    return true;
}
