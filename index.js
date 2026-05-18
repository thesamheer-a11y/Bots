require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")

/* FIXED IMPORTS */
const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const { Api } = require("telegram/tl")

/* BOT */
const bot = new TelegramBot(
    process.env.BOT_TOKEN,
    {
        polling: {
            autoStart: true,
            interval: 300
        }
    }
)

/* OWNER */
const OWNER_ID = "8715707181"

/* SAFE JSON LOAD (Fixed to prevent Railway crash) */
function loadJSON(file, def) {
    try {
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file, "utf8").trim()
            return data ? JSON.parse(data) : def
        }
        // Create file if it doesn't exist to prevent write errors later
        fs.writeFileSync(file, JSON.stringify(def, null, 2))
        return def
    } catch (e) {
        console.error(`Error loading ${file}:`, e)
        return def
    }
}

/* DATABASE */
let users = loadJSON("users.json", {})
let monitor = loadJSON("monitor.json", [])
let owned = loadJSON("owned.json", [])
let sessions = loadJSON("sessions.json", {})
let freeUsers = loadJSON("freeUsers.json", {})

/* SAVE */
function save(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2))
    } catch (e) {
        console.error(`Error saving ${file}:`, e)
    }
}

function saveAll() {
    save("users.json", users)
    save("monitor.json", monitor)
    save("owned.json", owned)
    save("sessions.json", sessions)
    save("freeUsers.json", freeUsers)
}

/* PREMIUM */
function isPremium(id) {
    if (String(id) === OWNER_ID) {
        return true
    }
    return users[id] && users[id].active
}

/* START */
bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🚀 Username Manager\n\n⚡ Auto Username Claim Bot\n\n👤 Free → 1 Username\n💎 Premium → Unlimited`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🇮🇳 Hindi", callback_data: "lang_hindi" },
                        { text: "🇵🇰 Punjabi", callback_data: "lang_punjabi" }
                    ],
                    [
                        { text: "💎 Plans", callback_data: "payment" }
                    ]
                ]
            }
        }
    )
})

/* CALLBACKS */
bot.on("callback_query", async (q) => {
    try {
        const data = q.data

        if (data === "lang_hindi") {
            return bot.editMessageText(
                `🚀 यूजरनेम मैनेजर\n\n⚡ ऑटो यूजरनेम क्लेम बॉट\n\n👤 फ्री → 1 यूजरनेम\n💎 प्रीमियम → अनलिमिटेड`,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🇮🇳 Hindi", callback_data: "lang_hindi" },
                                { text: "🇵🇰 Punjabi", callback_data: "lang_punjabi" }
                            ],
                            [
                                { text: "💎 प्लान्स", callback_data: "payment" }
                            ]
                        ]
                    }
                }
            )
        }

        if (data === "lang_punjabi") {
            return bot.editMessageText(
                `🚀 ਯੂਜ਼ਰਨੇਮ ਮੈਨੇਜਰ\n\n⚡ ਆਟੋ ਯੂਜ਼ਰਨੇਮ ਕਲੇਮ ਬੋਟ\n\n👤 ਫ੍ਰੀ → 1 ਯੂਜ਼ਰਨੇਮ\n💎 ਪ੍ਰੀਮੀਅਮ → ਅਨਲਿਮਿਟਡ`,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🇮🇳 Hindi", callback_data: "lang_hindi" },
                                { text: "🇵🇰 Punjabi", callback_data: "lang_punjabi" }
                            ],
                            [
                                { text: "💎 Plans", callback_data: "payment" }
                            ]
                        ]
                    }
                }
            )
        }

        if (data === "payment") {
            return bot.editMessageText(
                `💎 Premium Plans\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000\n\n💳 UPI:\n\`itzrao@fam\`\n\n📸 Send Screenshot`,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    parse_mode: "Markdown"
                }
            )
        }

        /* APPROVE */
        if (data.startsWith("approve_")) {
            let userId = data.split("_")[1]
            users[userId] = { active: true }
            saveAll()

            await bot.sendMessage(
                userId,
                `✅ Premium Activated\n\n/login\nThen Send Session\n\n/add username`
            )
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        /* DENY */
        if (data.startsWith("deny_")) {
            let userId = data.split("_")[1]
            await bot.sendMessage(userId, `❌ Payment Declined`)
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

    } catch (e) {
        console.error("Callback Error:", e)
    }
})

/* LOGIN */
bot.onText(/\/login/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🔐 Send String Session`,
        { reply_markup: { force_reply: true } }
    )
})

/* SAVE SESSION */
bot.on("message", async (msg) => {
    try {
        if (
            msg.reply_to_message &&
            msg.reply_to_message.text &&
            msg.reply_to_message.text.includes("String Session")
        ) {
            sessions[msg.from.id] = msg.text.trim()
            saveAll()
            bot.sendMessage(msg.chat.id, `✅ Account Linked`)
        }
    } catch (e) {
        console.error("Session Save Error:", e)
    }
})

/* ADD */
bot.onText(/\/add (.+)/, async (msg, match) => {
    try {
        let username = match[1].replace("@", "").trim().toLowerCase()

        if (String(msg.from.id) !== OWNER_ID && !sessions[msg.from.id]) {
            return bot.sendMessage(msg.chat.id, `🔐 Login First\n\n/login`)
        }

        if (!isPremium(msg.from.id) && String(msg.from.id) !== OWNER_ID) {
            if (!freeUsers[msg.from.id]) {
                freeUsers[msg.from.id] = []
            }
            if (freeUsers[msg.from.id].length >= 1) {
                return bot.sendMessage(msg.chat.id, `⚠️ Free Limit Reached`)
            }
            freeUsers[msg.from.id].push(username)
        }

        let exists = monitor.find(x => x.username === username)
        if (exists) {
            return bot.sendMessage(msg.chat.id, `⚠️ Already Monitoring`)
        }

        monitor.push({ user: msg.from.id, username: username })
        saveAll()

        bot.sendMessage(msg.chat.id, `✅ Monitoring Started\n\n@${username}`)
    } catch (e) {
        console.error("Add Command Error:", e)
    }
})

/* PLAN */
bot.onText(/\/plan/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `💎 Premium Plans\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000`,
        {
            reply_markup: {
                inline_keyboard: [[{ text: "Buy Premium", callback_data: "payment" }]]
            }
        }
    )
})

/* HELP */
bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, `📚 Commands\n\n/login\n/add username\n/plan\n/help`)
})

/* PAYMENT PHOTO */
bot.on("photo", async (msg) => {
    try {
        await bot.sendPhoto(
            OWNER_ID,
            msg.photo[msg.photo.length - 1].file_id,
            {
                caption: `💳 Payment\n\n👤 ${msg.from.id}`,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Approve", callback_data: `approve_${msg.from.id}` },
                            { text: "Deny", callback_data: `deny_${msg.from.id}` }
                        ]
                    ]
                }
            }
        )
        bot.sendMessage(msg.chat.id, `📸 Screenshot Sent`)
    } catch (e) {
        console.error("Photo Upload Error:", e)
    }
})

/* AUTO CLAIM LOOP (Optimized & Made Powerful to Prevent Crashes) */
setInterval(async () => {
    // If monitor queue is empty, do nothing
    if (monitor.length === 0) return;

    for (let i = monitor.length - 1; i >= 0; i--) {
        const data = monitor[i]
        try {
            await bot.getChat("@" + data.username)
        } catch (err) {
            try {
                if (
                    err.response &&
                    err.response.body &&
                    err.response.body.description &&
                    err.response.body.description.includes("chat not found")
                ) {
                    if (!sessions[data.user]) continue

                    const client = new TelegramClient(
                        new StringSession(sessions[data.user]),
                        Number(process.env.API_ID),
                        process.env.API_HASH,
                        { connectionRetries: 3 }
                    )

                    await client.connect()
                    
                    // Attempting to claim
                    await client.invoke(
                        new Api.account.UpdateUsername({ username: data.username })
                    )

                    if (!owned.includes(data.username)) {
                        owned.push(data.username)
                    }

                    // Remove successfully claimed username from monitor loop so it doesn't crash/loop
                    monitor.splice(i, 1)
                    saveAll()

                    await bot.sendMessage(data.user, `🎉 Claimed @${data.username}`)
                    await client.disconnect()
                }
            } catch (e) {
                console.error("Claiming Error for " + data.username + ":", e.message)
            }
        }
        // Small delay to prevent hitting Telegram API Flood limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}, 15000) // Adjusted slightly to 15s to bypass Railway engine heavy CPU spikes

/* GLOBAL CRASH PREVENTERS */
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", reason)
})
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err)
})
bot.on("polling_error", (err) => {
    console.error("Polling Error:", err.message)
})

console.log("🚀 BOT STARTED SUCCESSFULLY ON PRODUCTION ENVIRONMENT")
              
