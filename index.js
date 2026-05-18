require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")
const { createCanvas } = require("canvas")

/* FIXED IMPORTS */
const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const { Api } = require("telegram/tl")

/* BOT INITIALIZATION */
const bot = new TelegramBot(
    process.env.BOT_TOKEN,
    {
        polling: {
            autoStart: true,
            interval: 100 // Ultrafast response for commands
        }
    }
)

const OWNER_ID = "8715707181"
const BOT_USERNAME = "userownerbot" // Aapke channel/bot ka credit handler

/* SAFE JSON LOAD */
function loadJSON(file, def) {
    try {
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file, "utf8").trim()
            return data ? JSON.parse(data) : def
        }
        fs.writeFileSync(file, JSON.stringify(def, null, 2))
        return def
    } catch (e) {
        return def
    }
}

/* DATABASE */
let users = loadJSON("users.json", {})
let monitor = loadJSON("monitor.json", [])
let owned = loadJSON("owned.json", [])
let freeUsers = loadJSON("freeUsers.json", {})

/* SAVE DATA */
function save(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2))
    } catch (e) {}
}

function saveAll() {
    save("users.json", users)
    save("monitor.json", monitor)
    save("owned.json", owned)
    save("freeUsers.json", freeUsers)
}

/* PREMIUM CHECK */
function isPremium(id) {
    if (String(id) === OWNER_ID) return true
    return users[id] && users[id].active
}

/* FUNCTION: High-Tech Claims Photo Generator */
function generateClaimPhoto(username) {
    const width = 800
    const height = 450
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    // Luxury Dark/Neon Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#090d16") 
    gradient.addColorStop(1, "#111827") 
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Tech matrix glow
    ctx.fillStyle = "rgba(34, 197, 94, 0.08)"
    ctx.beginPath()
    ctx.arc(width/2, height/2, 200, 0, Math.PI * 2)
    ctx.fill()

    // Title Badge
    ctx.fillStyle = "#22c55e" 
    ctx.font = "bold 30px sans-serif"
    ctx.fillText("⚡ TARGET SNIPED SUCCESSFULLY", 60, 120)

    // Main Claimed Username
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 60px sans-serif"
    ctx.fillText(`@${username}`, 60, 230)

    // Divider Line
    ctx.strokeStyle = "rgba(34, 197, 94, 0.2)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(60, 290)
    ctx.lineTo(width - 60, 290)
    ctx.stroke()

    // Powered By Channel Footer
    ctx.fillStyle = "#94a3b8" 
    ctx.font = "22px sans-serif"
    ctx.fillText("Powered by", 60, 350)

    ctx.fillStyle = "#22c55e" 
    ctx.font = "bold 28px sans-serif"
    ctx.fillText(`@${BOT_USERNAME}`, 60, 390)

    return canvas.toBuffer("image/png")
}

/* START COMMAND (Asli Work Content Fixed) */
bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🚀 *Welcome to Auto Username Claim Bot*

⚡ *Yeh Bot Kya Kaam Karta Hai?*
Yeh ek ultra-fast username sniper bot hai. Jab bhi koi premium, radd, ya short username market me free hota hai, yeh bot mili-seconds ke andar use automatic aapke liye secure aur claim kar leta hai!

❌ *No Login Required:* Aapko apna personal number ya OTP share karne ki koi zaroorat nahi hai.

👤 Free Slots: 1 Target
💎 Premium Slots: Unlimited Targets

🎯 Target lagane ke liye abhi use karein: \`/add username\``,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🇮🇳 Hindi", callback_data: "lang_hindi" },
                        { text: "🇵🇰 Punjabi", callback_data: "lang_punjabi" }
                    ],
                    [
                        { text: "💎 Buy Premium Slots", callback_data: "payment" }
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
                `🚀 *ऑटो यूजरनेम क्लेम बॉट में आपका स्वागत है*

⚡ *यह बॉट क्या काम करता है?*
यह एक अल्ट्रा-फास्ट यूजरनेम स्निपर बॉट है। जैसे ही कोई भी यूजरनेम खाली या फ्री होता है, यह बॉट उसे पलक झपकते ही खुद-ब-खुद क्लेम और सिक्योर कर लेता है!

🎯 अपना टारगेट सेट करने के लिए टाइप करें: \`/add username\``,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    parse_mode: "Markdown",
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
                `🚀 *ਆਟੋ ਯੂਜ਼ਰਨੇਮ ਕਲੇਮ ਬੋਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ*

⚡ *ਇਹ ਬੋਟ ਕੀ ਕੰਮ ਕਰਦਾ ਹੈ?*
ਜਿਵੇਂ ਹੀ ਕੋਈ ਵੀ ਯੂਜ਼ਰਨੇਮ ਖਾਲੀ ਜਾਂ ਫ੍ਰੀ ਹੁੰਦਾ ਹੈ, ਇਹ ਬੋਟ ਮਿਲੀ-ਸੈਕਿੰਡ ਦੇ ਅੰਦਰ ਉਸਨੂੰ ਆਪਣੇ ਆਪ ਕਲੇਮ ਕਰ ਲੈਂਦਾ ਹੈ!

🎯 ਟਾਰਗੇਟ ਲਗਾਉਣ ਲਈ ਲਿਖੋ: \`/add username\``,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    parse_mode: "Markdown",
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
                `💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000\n\n💳 *UPI ID:* \`itzrao@fam\`\n\n📸 Screenshot yahan send karein!`,
                {
                    chat_id: q.message.chat.id,
                    message_id: q.message.message_id,
                    parse_mode: "Markdown"
                }
            )
        }

        if (data.startsWith("approve_")) {
            let userId = data.split("_")[1]
            users[userId] = { active: true }
            saveAll()

            await bot.sendMessage(userId, `✅ *Premium Activated!* Limits removed. Use: \`/add username\``, { parse_mode: "Markdown" })
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        if (data.startsWith("deny_")) {
            let userId = data.split("_")[1]
            await bot.sendMessage(userId, `❌ *Payment Declined.*`)
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

    } catch (e) {
        console.error("Callback Error:", e)
    }
})

/* ADD COMMAND */
bot.onText(/\/add (.+)/, async (msg, match) => {
    try {
        let username = match[1].replace("@", "").trim().toLowerCase()

        if (!isPremium(msg.from.id) && String(msg.from.id) !== OWNER_ID) {
            if (!freeUsers[msg.from.id]) {
                freeUsers[msg.from.id] = []
            }
            if (freeUsers[msg.from.id].length >= 1) {
                return bot.sendMessage(msg.chat.id, `⚠️ *Free Limit Reached!*\n\nUpgrade slots limit here -> /plan`, { parse_mode: "Markdown" })
            }
            freeUsers[msg.from.id].push(username)
        }

        let exists = monitor.find(x => x.username === username)
        if (exists) {
            return bot.sendMessage(msg.chat.id, `⚠️ This username is already in our high-speed sniper loop.`)
        }

        monitor.push({ user: msg.from.id, username: username })
        saveAll()

        bot.sendMessage(msg.chat.id, `🎯 *Target Hooked Successfully!*\n\nBot sniper engine is now watching: *@${username}*\nChecking every second for absolute execution.`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Add Command Error:", e)
    }
})

/* USER TRACKS STATUS */
bot.onText(/\/my/, async (msg) => {
    const myTargets = monitor.filter(x => x.user === msg.from.id).map(x => `@${x.username}`)
    if (myTargets.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Aapki monitor list khaali hai. Add targets: `/add username`", { parse_mode: "Markdown" })
    }
    bot.sendMessage(msg.chat.id, `📝 *Your Running Track Slots:*\n\n${myTargets.join("\n")}`, { parse_mode: "Markdown" })
})

/* PLAN COMMAND */
bot.onText(/\/plan/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000`,
        {
            reply_markup: {
                inline_keyboard: [[{ text: "Buy Access", callback_data: "payment" }]]
            },
            parse_mode: "Markdown"
        }
    )
})

/* HELP COMMAND */
bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, `📚 *Commands:*\n\n🔹 \`/add username\` - Add username to sniper loop\n🔹 \`/my\` - Show your ongoing targets\n🔹 \`/plan\` - Premium details\n🔹 \`/help\` - Show this help menu`, { parse_mode: "Markdown" })
})

/* SCREENSHOT PAYMENT RECEIVER */
bot.on("photo", async (msg) => {
    try {
        await bot.sendPhoto(
            OWNER_ID,
            msg.photo[msg.photo.length - 1].file_id,
            {
                caption: `💳 *New Premium Request*\n\n👤 Sender Identity: \`${msg.from.id}\``,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Approve ✅", callback_data: `approve_${msg.from.id}` },
                            { text: "Deny ❌", callback_data: `deny_${msg.from.id}` }
                        ]
                    ]
                }
            }
        )
        bot.sendMessage(msg.chat.id, `📸 *Receipt delivered!* Waiting for manual verification.`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Photo Upload Error:", e)
    }
})

/* INSTANT SNIPER ENGINE CORE (Checks & Claims inside 1 Second Loop) */
setInterval(async () => {
    if (monitor.length === 0) return

    if (!process.env.OWNER_SESSION) {
        console.log("CRITICAL ERROR: OWNER_SESSION is missing inside variables!")
        return
    }

    for (let i = monitor.length - 1; i >= 0; i--) {
        const data = monitor[i]
        let isAvailable = false

        // FORCE CHECK: Har condition me availability test karega
        try {
            await bot.getChat("@" + data.username)
        } catch (err) {
            // Agar "chat not found" aaye ya error code 400 ho, matlab username khaali hai!
            if (err.response && err.response.body) {
                const desc = err.response.body.description || ""
                if (desc.includes("chat not found") || err.response.statusCode === 400) {
                    isAvailable = true
                }
            } else {
                isAvailable = true // Failsafe fallback
            }
        }

        // INSTANT CLAIM EXECUTION
        if (isAvailable) {
            try {
                const client = new TelegramClient(
                    new StringSession(process.env.OWNER_SESSION),
                    Number(process.env.API_ID),
                    process.env.API_HASH,
                    { connectionRetries: 3 }
                )

                await client.connect()
                
                // Attack MTProto trigger to capture username instantly
                await client.invoke(
                    new Api.account.UpdateUsername({ username: data.username })
                )

                if (!owned.includes(data.username)) {
                    owned.push(data.username)
                }

                // Remove from queue fast to block multi-execution crashes
                monitor.splice(i, 1)
                saveAll()

                // Generate Photo dynamic banner
                const photoBuffer = generateClaimPhoto(data.username)

                // Detailed announcement response message 
                const announcementText = `🔥 *BOOM! USERNAME SNIPED BY @${BOT_USERNAME}* 🔥\n\n` +
                                         `👑 *Status:* SUCCESSFULLY SECURED\n` +
                                         `🎯 *Username:* @${data.username}\n` +
                                         `👤 *Requested By User ID:* \`${data.user}\`\n\n` +
                                         `*Note:* Yeh username successfully secure ho chuka hai. Iske transfer system ke liye admin se contact karein.`

                await bot.sendPhoto(data.user, photoBuffer, { caption: announcementText, parse_mode: "Markdown" })
                
                await client.disconnect()
            } catch (e) {
                console.error("Sniper Claim Collision Error for " + data.username + ":", e.message)
            }
        }
    }
}, 1000) // Fast 1-Second Execution Loop

/* SYSTEM FAILSAFE PROTECTION */
process.on("unhandledRejection", (reason) => {})
process.on("uncaughtException", (err) => {})
bot.on("polling_error", (err) => {})

console.log("🚀 INSTANT SNIPER MODE IS RAW AND RUNNING")
                                                                     
