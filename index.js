require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")
const { createCanvas } = require("canvas") // High-quality image creation

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
            interval: 300
        }
    }
)

const OWNER_ID = "8715707181"
const BOT_USERNAME = "userownerbot" // Banner credit username

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
        console.error(`Error loading ${file}:`, e)
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
    } catch (e) {
        console.error(`Error saving ${file}:`, e)
    }
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

    // Dark Tech Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#0f172a") 
    gradient.addColorStop(1, "#1e1b4b") 
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Glow effect shapes
    ctx.fillStyle = "rgba(99, 102, 241, 0.12)"
    ctx.beginPath()
    ctx.arc(width - 80, 120, 160, 0, Math.PI * 2)
    ctx.fill()

    // Title Badge
    ctx.fillStyle = "#22c55e" 
    ctx.font = "bold 28px sans-serif"
    ctx.fillText("🎉 SUCCESSFULLY CLAIMED", 60, 130)

    // Main Claimed Username
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 52px sans-serif"
    ctx.fillText(`@${username}`, 60, 225)

    // Elegant separator line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(60, 285)
    ctx.lineTo(width - 60, 285)
    ctx.stroke()

    // Powered By Section
    ctx.fillStyle = "#94a3b8" 
    ctx.font = "22px sans-serif"
    ctx.fillText("Powered by", 60, 340)

    ctx.fillStyle = "#6366f1" 
    ctx.font = "bold 26px sans-serif"
    ctx.fillText(`@${BOT_USERNAME}`, 60, 380)

    return canvas.toBuffer("image/png")
}

/* START COMMAND */
bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🚀 *Username Sniper Manager*\n\n🔥 *No Login Required!* Ab aapko apna account number ya OTP dene ki koi zaroorat nahi hai. Bot seedhe aapke liye username secure karega!\n\n👤 Free User → 1 Slot Limit\n💎 Premium User → Unlimited Slots`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🇮🇳 Hindi", callback_data: "lang_hindi" },
                        { text: "🇵🇰 Punjabi", callback_data: "lang_punjabi" }
                    ],
                    [
                        { text: "💎 Premium Plans", callback_data: "payment" }
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
                `🚀 *यूजरनेम स्निपर मैनेजर*\n\n🔥 *लॉगिन की कोई आवश्यकता नहीं!* बस अपना पसंदीदा यूजरनेम जोड़ें और बॉट उसे खुद-ब-खुद आपके लिए क्लेम कर लेगा।\n\n👤 फ्री यूजर → 1 यूजरनेम\n💎 प्रीमियम यूजर → अनलिमिटेड`,
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
                `🚀 *ਯੂਜ਼ਰਨੇਮ ਸਨਾਈਪਰ ਮੈਨੇਜਰ*\n\n🔥 *ਕੋਈ ਲੋਗਿਨ ਲੋੜ ਨਹੀਂ!* ਬਸ ਆਪਣਾ ਯੂਜ਼ਰਨੇਮ ਜੋੜੋ, ਬੋਟ ਆਪਣੇ ਆਪ ਕਲੇਮ ਕਰੇਗਾ।\n\n👤 ਫ੍ਰੀ → 1 ਯੂਜ਼ਰਨੇਮ\n💎 ਪ੍ਰੀਮੀਅਮ → ਅਨਲਿਮਿਟਡ`,
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
                `💎 *Premium Plans*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000\n\n💳 *UPI ID:* \`itzrao@fam\`\n\n📸 Screenshot yahan send karein!`,
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

            await bot.sendMessage(userId, `✅ *Premium Activated!*\n\nAapki limits hatadi gayi hain. Ab use karein: \`/add username\``, { parse_mode: "Markdown" })
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        if (data.startsWith("deny_")) {
            let userId = data.split("_")[1]
            await bot.sendMessage(userId, `❌ *Payment Declined.* Dubara check karke bhejien.`)
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
            return bot.sendMessage(msg.chat.id, `⚠️ This username is already in the target system loop.`)
        }

        monitor.push({ user: msg.from.id, username: username })
        saveAll()

        bot.sendMessage(msg.chat.id, `🎯 *Monitoring Hooked!*\n\nBot target list updated: *@${username}*\nChecking non-stop now.`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Add Command Error:", e)
    }
})

/* USER TRACKS STATUS COMMAND */
bot.onText(/\/my/, async (msg) => {
    const myTargets = monitor.filter(x => x.user === msg.from.id).map(x => `@${x.username}`)
    if (myTargets.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Aapki active list empty hai. Targets badhane ke liye use karein: `/add username`", { parse_mode: "Markdown" })
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
    bot.sendMessage(msg.chat.id, `📚 *Available Command Protocols:*\n\n🔹 \`/add username\` - Drop target file inside loop\n🔹 \`/my\` - Watch ongoing engine tracks\n🔹 \`/plan\` - Shop license plans\n🔹 \`/help\` - Show protocols`, { parse_mode: "Markdown" })
})

/* SCREENSHOT VALIDATION RECEIVER */
bot.on("photo", async (msg) => {
    try {
        await bot.sendPhoto(
            OWNER_ID,
            msg.photo[msg.photo.length - 1].file_id,
            {
                caption: `💳 *New Premium Activation Request*\n\n👤 Sender Identity: \`${msg.from.id}\``,
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
        bot.sendMessage(msg.chat.id, `📸 *Receipt successfully delivered!* Awaiting owner execution.`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Photo Upload Error:", e)
    }
})

/* FIXED PRO SNIPER CORE ENGINE (Claims automatically using Owner Session) */
setInterval(async () => {
    if (monitor.length === 0) return

    if (!process.env.OWNER_SESSION) {
        console.log("CRITICAL ERROR: OWNER_SESSION key variable is empty inside cloud configuration!")
        return
    }

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
                    const client = new TelegramClient(
                        new StringSession(process.env.OWNER_SESSION),
                        Number(process.env.API_ID),
                        process.env.API_HASH,
                        { connectionRetries: 3 }
                    )

                    await client.connect()
                    
                    // Direct internal API dispatch
                    await client.invoke(
                        new Api.account.UpdateUsername({ username: data.username })
                    )

                    if (!owned.includes(data.username)) {
                        owned.push(data.username)
                    }

                    // Delete item instantly from stack queue to eliminate infinity-loops
                    monitor.splice(i, 1)
                    saveAll()

                    // Dynamic Banner Dispatching
                    const photoBuffer = generateClaimPhoto(data.username)

                    await bot.sendPhoto(
                        data.user, 
                        photoBuffer, 
                        { 
                            caption: `🎯 *Target Sniped Successfully!*\n\n🔗 *Username Secured:* @${data.username}\n\nYeh username safe account vault me save ho chuka hai. Transfer ke liye owner se contact karein.`,
                            parse_mode: "Markdown"
                        }
                    )
                    
                    await client.disconnect()
                }
            } catch (e) {
                console.error("Sniper Request Collision for " + data.username + ":", e.message)
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000)) // Safe structural network delays
    }
}, 12000)

/* FAILSAFE CRASH CONTROLLERS */
process.on("unhandledRejection", (reason) => {
    console.error("Saved Crash Prevented (Rejection):", reason)
})
process.on("uncaughtException", (err) => {
    console.error("Saved Crash Prevented (Exception):", err)
})
bot.on("polling_error", (err) => {
    console.error("Polling System Error Ignored:", err.message)
})

console.log("🚀 PRODUCTION ENGINE ACTIVE - SECURE AUTO MODE IS ONLINE")
