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
            interval: 300
        }
    }
)

const OWNER_ID = "8715707181"
const BOT_USERNAME = "userownerbot" 

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

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#090d16") 
    gradient.addColorStop(1, "#111827") 
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "rgba(34, 197, 94, 0.08)"
    ctx.beginPath()
    ctx.arc(width/2, height/2, 200, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#22c55e" 
    ctx.font = "bold 30px sans-serif"
    ctx.fillText("⚡ TARGET SNIPED SUCCESSFULLY", 60, 120)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 60px sans-serif"
    ctx.fillText(`@${username}`, 60, 230)

    ctx.strokeStyle = "rgba(34, 197, 94, 0.2)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(60, 290)
    ctx.lineTo(width - 60, 290)
    ctx.stroke()

    ctx.fillStyle = "#94a3b8" 
    ctx.font = "22px sans-serif"
    ctx.fillText("Powered by", 60, 350)

    ctx.fillStyle = "#22c55e" 
    ctx.font = "bold 28px sans-serif"
    ctx.fillText(`@${BOT_USERNAME}`, 60, 390)

    return canvas.toBuffer("image/png")
}

/* START COMMAND */
bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🚀 *Welcome to Auto Username Claim Bot*

⚡ *Yeh Bot Kya Kaam Karta Hai?*
Yeh ek ultra-fast username sniper bot hai. Jab bhi koi premium, radd, ya short username market me free hota hai, yeh bot mili-seconds ke andar use automatic aapke liye secure aur claim kar leta hai!

❌ *No Login Required:* Aapko apna personal number ya OTP share karne ki koi zaroorat nahi hai.

👤 Free Slots: 1 Target
💎 Premium Slots: Unlimited Targets

🎯 Target lagane ke liye abhi use karein: \`/add username\`
📦 Apne claimed username ko lene ke liye: \`/transfer\``,
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
        const userId = q.from.id

        if (data === "lang_hindi") {
            return bot.editMessageText(`🚀 *ऑटो यूजरनेम क्लेम बॉट में आपका स्वागत है*\n\n⚡ *यह बॉट क्या काम करता है?*\nयह एक अब्दुल-फास्ट यूजरनेम स्निपर बॉट है। जैसे ही कोई भी यूजरनेम खाली या फ्री होता है, यह बॉट उसे पलक झपकते ही खुद-ब-खुद क्लेम और सिक्योर कर लेता है!\n\n🎯 अपना टारगेट सेट करने के लिए टाइप करें: \`/add username\``, { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: "Markdown" })
        }

        if (data === "lang_punjabi") {
            return bot.editMessageText(`🚀 *ਆਟੋ ਯੂਜ਼ਰਨੇਮ ਕਲੇਮ ਬੋਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ*\n\n⚡ *ਇਹ ਬੋਟ ਕੀ ਕੰਮ ਕਰਦਾ ਹੈ?*\nਜਿਵੇਂ ਹੀ ਕੋਈ ਵੀ ਯੂਜ਼ਰਨੇਮ ਖਾਲੀ ਜਾਂ ਫ੍ਰੀ ਹੁੰਦਾ ਹੈ, ਇਹ ਬੋਟ ਮਿਲੀ-ਸੈਕਿੰਡ ਦੇ ਅੰਦਰ ਉਸਨੂੰ ਆਪਣੇ ਆਪ ਕਲੇਮ ਕਰ ਲੈਂਦਾ ਹੈ!\n\n🎯 ਟਾਰਗੇਟ ਲਗਾਉਣ ਲਈ ਲਿਖੋ: \`/add username\``, { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: "Markdown" })
        }

        if (data === "payment") {
            return bot.editMessageText(`💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000\n\n💳 *UPI ID:* \`itzrao@fam\`\n\n📸 Screenshot yahan send karein!`, { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: "Markdown" })
        }

        if (data.startsWith("approve_")) {
            let targetUid = data.split("_")[1]
            users[targetUid] = { active: true }
            saveAll()
            await bot.sendMessage(targetUid, `✅ *Premium Activated!* Limits removed. Use: \`/add username\``, { parse_mode: "Markdown" })
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        if (data.startsWith("deny_")) {
            let targetUid = data.split("_")[1]
            await bot.sendMessage(targetUid, `❌ *Payment Declined.*`)
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        /* TRANSFER FLOW CALLBACK */
        if (data.startsWith("trf_")) {
            const targetUsername = data.split("_")[1]
            const record = owned.find(x => x.username === targetUsername && x.claimedBy === userId)

            if (!record) {
                return bot.answerCallbackQuery(q.id, { text: "❌ Record Not Found!", show_alert: true })
            }

            await bot.answerCallbackQuery(q.id, { text: "⚡ Processing Transfer..." })

            const client = new TelegramClient(new StringSession(process.env.OWNER_SESSION), Number(process.env.API_ID), process.env.API_HASH, { connectionRetries: 3 })
            await client.connect()

            try {
                const inviteLinkObj = await client.invoke(
                    new Api.messages.ExportChatInvite({
                        peer: record.channelId,
                        title: "Transfer Link"
                    })
                )

                const channelInviteLink = inviteLinkObj.link

                await bot.sendMessage(
                    userId,
                    `🔗 *Step 1:* Pehle is private invitation link par click karke channel join kijiye:\n\n${channelInviteLink}\n\n*Step 2:* Join karne ke baad niche diye gaye validation button par click karein ownership transfer complete karne ke liye.`,
                    {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [[{ text: "Confirm Joined & Transfer Ownership 👑", callback_data: `conf_trf_${targetUsername}` }]]
                        }
                    }
                )
            } catch (err) {
                await bot.sendMessage(userId, `❌ Transfer processing error: ${err.message}`)
            } finally {
                await client.disconnect()
            }
        }

        /* CONFIRM TRANSFER EXECUTION */
        if (data.startsWith("conf_trf_")) {
            const targetUsername = data.split("_")[1]
            const record = owned.find(x => x.username === targetUsername && x.claimedBy === userId)

            if (!record) return;

            const client = new TelegramClient(new StringSession(process.env.OWNER_SESSION), Number(process.env.API_ID), process.env.API_HASH, { connectionRetries: 3 })
            await client.connect()

            try {
                await client.invoke(
                    new Api.channels.EditAdmin({
                        channel: record.channelId,
                        userId: String(userId),
                        adminRights: new Api.chatAdminRights({
                            changeInfo: true,
                            postMessages: true,
                            editMessages: true,
                            deleteMessages: true,
                            banUsers: true,
                            inviteUsers: true,
                            pinMessages: true,
                            addAdmins: true,
                            anonymous: false,
                            manageCall: true,
                            other: true
                        }),
                        rank: "New Owner"
                    })
                )

                await client.invoke(
                    new Api.channels.UpdateOwner({
                        channel: record.channelId,
                        newOwner: String(userId),
                        password: new Api.InputCheckPasswordEmpty()
                    })
                )

                owned = owned.filter(x => x.username !== targetUsername)
                saveAll()

                await bot.sendMessage(userId, `👑 *SUCCESSAL OWNERSHIP HANDOVER COMPLETE!*\n\n@${targetUsername} channel ki complete creator ownership aapke account par successfully transfer kar di gayi hai!`)
            } catch (err) {
                await bot.sendMessage(userId, `⚠️ *Transfer Error:* ${err.message}\n\nAgar aapne channel join nahi kiya hai, to pehle join karein aur dubara button dabayein!`)
            } finally {
                await client.disconnect()
            }
        }

    } catch (e) {
        console.error("Callback Core Error:", e)
    }
})

/* ADD COMMAND */
bot.onText(/\/add (.+)/, async (msg, match) => {
    try {
        let username = match[1].replace("@", "").trim().toLowerCase()

        if (!isPremium(msg.from.id) && String(msg.from.id) !== OWNER_ID) {
            if (!freeUsers[msg.from.id]) freeUsers[msg.from.id] = []
            if (freeUsers[msg.from.id].length >= 1) {
                return bot.sendMessage(msg.chat.id, `⚠️ *Free Limit Reached!*\n\nUpgrade slots limit here -> /plan`, { parse_mode: "Markdown" })
            }
            freeUsers[msg.from.id].push(username)
        }

        let exists = monitor.find(x => x.username === username)
        if (exists) {
            return bot.sendMessage(msg.chat.id, `⚠️ This username is already in our high-speed sniper loop.`)
        }

        // Generate a random ID between 1 and 1000 for deletion routing mapping
        let randomId = Math.floor(Math.random() * 1000) + 1
        
        monitor.push({ user: msg.from.id, username: username, dId: randomId })
        saveAll()

        bot.sendMessage(msg.chat.id, `🎯 *Target Hooked Successfully!*\n\nBot sniper engine is now watching: *@${username}*`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Add Command Error:", e)
    }
})

/* MY COMMAND (With Instant Tap Delete Command Tags) */
bot.onText(/\/my/, async (msg) => {
    const userId = msg.from.id
    const myTargets = monitor.filter(x => x.user === userId)
    
    if (myTargets.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Aapki monitor list khaali hai. Add targets: `/add username`", { parse_mode: "Markdown" })
    }

    let responseStr = `📝 *Your Running Track Slots:*\n\n`
    myTargets.forEach(x => {
        // Fallback for old targets that don't have dId assigned yet
        if (!x.dId) {
            x.dId = Math.floor(Math.random() * 1000) + 1
        }
        responseStr += `• *@${x.username}* ➔ \`/delete_${x.dId}\`\n`
    })
    
    saveAll() // Ensure fallback mapping gets written down instantly
    bot.sendMessage(msg.chat.id, responseStr, { parse_mode: "Markdown" })
})

/* TARGET DELETION PROTOCOL ENGINE VIA TAP-CMD */
bot.onText(/\/delete_(.+)/, async (msg, match) => {
    try {
        const targetId = Number(match[1])
        const userId = msg.from.id

        // Locate specific match index in queue mapping tracking logs
        const index = monitor.findIndex(x => x.user === userId && x.dId === targetId)

        if (index === -1) {
            return bot.sendMessage(msg.chat.id, "❌ *Target Not Found:* Yeh entry invalid hai ya pehle hi remove ho chuki hai.", { parse_mode: "Markdown" })
        }

        const removedTarget = monitor[i = index].username

        // Clean database references out of structural file systems 
        monitor.splice(index, 1)
        
        // Remove from free limits pool if user is a free tier client
        if (freeUsers[userId]) {
            freeUsers[userId] = freeUsers[userId].filter(u => u !== removedTarget)
        }

        saveAll()

        bot.sendMessage(msg.chat.id, `✅ *Target Removed:* *@${removedTarget}* ko aapki running slot tracking queue se successfully delete kar diya gaya hai.`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Deletion Command Route Error:", e)
    }
})

/* DYNAMIC INLINE TRANSFER INTERFACE COMMAND */
bot.onText(/\/transfer/, async (msg) => {
    const userId = msg.from.id
    const userClaims = owned.filter(x => x.claimedBy === userId)

    if (userClaims.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Bot ne aapke liye abhi tak koi username claim nahi kiya hai.")
    }

    let keyboardButtons = []
    userClaims.forEach(item => {
        keyboardButtons.push([{ text: `🎁 Claim @${item.username}`, callback_data: `trf_${item.username}` }])
    })

    bot.sendMessage(
        msg.chat.id,
        `📦 *Your Sniped Usernames Inventory*\n\nNiche diye gaye buttons me se select karein ki aap kis username ki ownership apne Telegram account par transfer karwana chahte hain:`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboardButtons
            }
        }
    )
})

/* PLAN COMMAND */
bot.onText(/\/plan/, async (msg) => {
    bot.sendMessage(msg.chat.id, `💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000`, { reply_markup: { inline_keyboard: [[{ text: "Buy Access", callback_data: "payment" }]] }, parse_mode: "Markdown" })
})

/* HELP COMMAND */
bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, `📚 *Commands:*\n\n🔹 \`/add username\` - Add to sniper loop\n🔹 \`/my\` - Ongoing track targets & delete option\n🔹 \`/transfer\` - Take ownership of claimed usernames\n🔹 \`/plan\` - Premium details`, { parse_mode: "Markdown" })
})

/* PHOTO HANDLER */
bot.on("photo", async (msg) => {
    try {
        await bot.sendPhoto(OWNER_ID, msg.photo[msg.photo.length - 1].file_id, { caption: `💳 *New Premium Request*\n\n👤 Sender Identity: \`${msg.from.id}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Approve ✅", callback_data: `approve_${msg.from.id}` }, { text: "Deny ❌", callback_data: `deny_${msg.from.id}` }]] } })
        bot.sendMessage(msg.chat.id, `📸 *Receipt delivered!*`, { parse_mode: "Markdown" })
    } catch (e) {}
})

/* PRO-LEVEL SNIPER LOOP ENGINE (Instant 1-Second Check & Claim) */
setInterval(async () => {
    if (monitor.length === 0) return
    if (!process.env.OWNER_SESSION) return

    for (let i = monitor.length - 1; i >= 0; i--) {
        const data = monitor[i]
        let isAvailable = false

        try {
            await bot.getChat("@" + data.username)
        } catch (err) {
            if (err.response && err.response.body) {
                const desc = err.response.body.description || ""
                if (desc.includes("chat not found") || err.response.statusCode === 400) {
                    isAvailable = true
                }
            } else {
                isAvailable = true
            }
        }

        if (isAvailable) {
            const client = new TelegramClient(new StringSession(process.env.OWNER_SESSION), Number(process.env.API_ID), process.env.API_HASH, { connectionRetries: 3 })
            
            try {
                await client.connect()
                
                const createChannelResult = await client.invoke(
                    new Api.channels.CreateChannel({
                        title: `Reserved Space ${data.username}`,
                        about: `Secured by @${BOT_USERNAME}`,
                        broadcast: true,
                        megagroup: false
                    })
                )

                const channelId = createChannelResult.chats[0].id

                await client.invoke(
                    new Api.channels.UpdateUsername({
                        channel: channelId,
                        username: data.username
                    })
                )

                owned.push({
                    username: data.username,
                    claimedBy: data.user,
                    channelId: channelId.toString()
                })

                monitor.splice(i, 1)
                saveAll()

                const photoBuffer = generateClaimPhoto(data.username)
                const announcementText = `🔥 *BOOM! USERNAME SNIPED BY @${BOT_USERNAME}* 🔥\n\n👑 *Status:* SUCCESSFULLY SECURED\n🎯 *Username:* @${data.username}\n\n📦 *Ownership Note:* Apna ownership title lene ke liye abhi chat me \`/transfer\` command types karein!`

                await bot.sendPhoto(data.user, photoBuffer, { caption: announcementText, parse_mode: "Markdown" })
                
            } catch (e) {
                console.error("Critical Sniper Execution Exception:", e.message)
            } finally {
                await client.disconnect()
            }
        }
    }
}, 1000)

/* FAILSAFE PROTECTION */
process.on("unhandledRejection", () => {})
process.on("uncaughtException", () => {})
bot.on("polling_error", () => {})

console.log("🚀 PRODUCTION ENGINE LOADED WITH AUTO /DELETE STRATEGIES")
                
