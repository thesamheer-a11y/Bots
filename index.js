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
            interval: 200
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

/* HIGH-TECH CLAIMS PHOTO GENERATOR */
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

/* SEAMLESS DIRECT CLAIM LOGIC FUNCTION */
async function tryDirectClaim(username, userId) {
    if (!process.env.OWNER_SESSION) return false

    const client = new TelegramClient(new StringSession(process.env.OWNER_SESSION), Number(process.env.API_ID), process.env.API_HASH, { connectionRetries: 3 })
    
    try {
        await client.connect()
        
        const createChannelResult = await client.invoke(
            new Api.channels.CreateChannel({
                title: `Reserved Space ${username}`,
                about: `Secured by @${BOT_USERNAME}`,
                broadcast: true,
                megagroup: false
            })
        )

        const channelId = createChannelResult.chats[0].id

        await client.invoke(
            new Api.channels.UpdateUsername({
                channel: channelId,
                username: username
            })
        )

        let uniqueDeletionId = Math.floor(Math.random() * 1000) + 1

        owned.push({
            username: username,
            claimedBy: userId,
            channelId: channelId.toString(),
            dId: uniqueDeletionId
        })
        saveAll()

        const photoBuffer = generateClaimPhoto(username)
        const announcementText = `🔥 *BOOM! INSTANTLY SNIPED BY @${BOT_USERNAME}* 🔥\n\n👑 *Status:* SUCCESSFULLY SECURED\n🎯 *Username:* @${username}\n\n📦 *Ownership Note:* Check your claimed stock using \`/my\` to instantly release and grab this username!`

        await bot.sendPhoto(userId, photoBuffer, { caption: announcementText, parse_mode: "Markdown" })
        return true

    } catch (e) {
        console.error("Direct Claim Internal Error:", e.message)
        return false
    } finally {
        await client.disconnect()
    }
}

/* START COMMAND */
bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `🚀 *Welcome to Auto Username Claim Bot*

⚡ *What does this bot do?*
This is an ultra-fast username sniper bot. Whenever a premium, short, or dropped username becomes free in the market, this bot automatically claims and secures it for you within milliseconds!

❌ *No Login Required:* No need to share your phone number, password, or OTP.

👤 Free Slots: 1 Target
💎 Premium Slots: Unlimited Targets

🎯 To add a target, use: \`/add username\`
📊 To view running targets, use: \`/track\`
📦 To view your successfully claimed stock, use: \`/my\``,
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

/* ADD COMMAND (With Instant Firing Engine) */
bot.onText(/\/add (.+)/, async (msg, match) => {
    try {
        let username = match[1].replace("@", "").trim().toLowerCase()
        const userId = msg.from.id

        if (!isPremium(userId) && String(userId) !== OWNER_ID) {
            if (!freeUsers[userId]) freeUsers[userId] = []
            if (freeUsers[userId].length >= 1) {
                return bot.sendMessage(msg.chat.id, `⚠️ *Free Limit Reached!*\n\nUpgrade slots limit here -> /plan`, { parse_mode: "Markdown" })
            }
        }

        let exists = monitor.find(x => x.username === username)
        if (exists) {
            return bot.sendMessage(msg.chat.id, `⚠️ This username is already in our high-speed sniper loop.`)
        }

        // STEP 1: Instant Check immediately upon receiving input
        let isCurrentlyAvailable = false
        try {
            await bot.getChat("@" + username)
        } catch (err) {
            if (err.response && err.response.body) {
                const desc = err.response.body.description || ""
                if (desc.includes("chat not found") || err.response.statusCode === 400) {
                    isCurrentlyAvailable = true
                }
            } else {
                isCurrentlyAvailable = true
            }
        }

        // STEP 2: If available now, execute direct claim bypass
        if (isCurrentlyAvailable) {
            bot.sendMessage(msg.chat.id, `⚡ *Target is free! Attempting instant claim...*`, { parse_mode: "Markdown" })
            let success = await tryDirectClaim(username, userId)
            if (success) {
                if (!isPremium(userId) && String(userId) !== OWNER_ID) {
                    freeUsers[userId].push(username)
                    saveAll()
                }
                return // Exit out cleanly, no need to push to /track loop
            } else {
                bot.sendMessage(msg.chat.id, `❌ *Instant claim failed due to network collision. Putting into live track loop now...*`, { parse_mode: "Markdown" })
            }
        }

        // STEP 3: If not instantly available, push to high-speed loop queue securely
        let randomId = Math.floor(Math.random() * 1000) + 1
        monitor.push({ user: userId, username: username, dId: randomId })
        
        if (!isPremium(userId) && String(userId) !== OWNER_ID) {
            freeUsers[userId].push(username)
        }
        
        saveAll()
        bot.sendMessage(msg.chat.id, `🎯 *Target Hooked Successfully!*\n\nBot sniper engine is now watching: *@${username}*`, { parse_mode: "Markdown" })

    } catch (e) {
        console.error("Add Command Error:", e)
    }
})

/* TRACK COMMAND (Active scans list) */
bot.onText(/\/track/, async (msg) => {
    const userId = msg.from.id
    const myTargets = monitor.filter(x => x.user === userId)
    
    if (myTargets.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ Your active monitor list is currently empty.", { parse_mode: "Markdown" })
    }

    let responseStr = `📝 *Active Monitoring Targets:*\n\n`
    myTargets.forEach(x => {
        responseStr += `• *@${x.username}* (Scanning Live...)\n`
    })
    
    bot.sendMessage(msg.chat.id, responseStr, { parse_mode: "Markdown" })
})

/* MY COMMAND (Secured stock ready for drop) */
bot.onText(/\/my/, async (msg) => {
    const userId = msg.from.id
    const userClaims = owned.filter(x => x.claimedBy === userId)

    if (userClaims.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ You don't have any successfully claimed usernames yet.")
    }

    let responseStr = `📦 *Your Successfully Secured Stock:*\n\n` +
                      `Tap the corresponding command next to your username to delete the reserve channel and claim it yourself:\n\n`

    userClaims.forEach(x => {
        if (!x.dId) {
            x.dId = Math.floor(Math.random() * 1000) + 1
        }
        responseStr += `• @${x.username} ➔ /delete_${x.dId}\n`
    })

    saveAll()
    bot.sendMessage(msg.chat.id, responseStr)
})

/* DROPPING PROTOCOL WITH SOLID CLEAN OUTPUT */
bot.onText(/\/delete_(.+)/, async (msg, match) => {
    try {
        const targetId = Number(match[1])
        const userId = msg.from.id

        const index = owned.findIndex(x => x.claimedBy === userId && x.dId === targetId)

        if (index === -1) {
            return bot.sendMessage(msg.chat.id, "Error: Selected entry is invalid or has already been dropped.")
        }

        const record = owned[index]
        const TargetUserHandle = record.username
        const TargetChannelUID = record.channelId

        const client = new TelegramClient(new StringSession(process.env.OWNER_SESSION), Number(process.env.API_ID), process.env.API_HASH, { connectionRetries: 3 })
        await client.connect()

        try {
            await client.invoke(
                new Api.channels.DeleteChannel({
                    channel: TargetChannelUID
                })
            )

            owned.splice(index, 1)
            
            // Re-open slot inside free tier if available
            if (freeUsers[userId]) {
                freeUsers[userId] = freeUsers[userId].filter(u => u !== TargetUserHandle)
            }
            
            saveAll()

            bot.sendMessage(
                msg.chat.id,
                "Success! I have successfully deleted the reserve channel holding @" + TargetUserHandle + ". You can now completely own and assign the username to your account immediately!"
            )

        } catch (channelErr) {
            bot.sendMessage(msg.chat.id, "Operation Error: " + channelErr.message)
        } finally {
            await client.disconnect()
        }

    } catch (e) {
        console.error("Deletion Processing Failure:", e)
    }
})

/* PLAN COMMAND */
bot.onText(/\/plan/, async (msg) => {
    bot.sendMessage(msg.chat.id, `💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000`, { reply_markup: { inline_keyboard: [[{ text: "Buy Access", callback_data: "payment" }]] }, parse_mode: "Markdown" })
})

/* HELP COMMAND */
bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, `📚 *Commands:*\n\n🔹 \`/add username\` - Add to sniper loop (Instant claim check active)\n🔹 \`/track\` - View active targeting loops\n🔹 \`/my\` - View your claimed stock\n🔹 \`/plan\` - Premium details`, { parse_mode: "Markdown" })
})

/* CALLBACKS FALLBACK & APPROVALS */
bot.on("callback_query", async (q) => {
    try {
        const data = q.data
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
    } catch (e) {}
})

/* PHOTO HANDLER */
bot.on("photo", async (msg) => {
    try {
        await bot.sendPhoto(OWNER_ID, msg.photo[msg.photo.length - 1].file_id, { caption: `💳 *New Premium Request*\n\n👤 Sender Identity: \`${msg.from.id}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Approve ✅", callback_data: `approve_${msg.from.id}` }, { text: "Deny ❌", callback_data: `deny_${msg.from.id}` }]] } })
        bot.sendMessage(msg.chat.id, `📸 *Receipt delivered!*`, { parse_mode: "Markdown" })
    } catch (e) {}
})

/* HIGH-SPEED BACKGROUND SNIPER LOOP ENGINE (1-Second Interval with Auto-Remove From Track) */
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

                let uniqueDeletionId = Math.floor(Math.random() * 1000) + 1

                owned.push({
                    username: data.username,
                    claimedBy: data.user,
                    channelId: channelId.toString(),
                    dId: uniqueDeletionId
                })

                // CRITICAL FIX: Instantly slice from the active monitoring array so it clears from /track immediately!
                monitor.splice(i, 1)
                saveAll()

                const photoBuffer = generateClaimPhoto(data.username)
                const announcementText = `🔥 *BOOM! USERNAME SNIPED BY @${BOT_USERNAME}* 🔥\n\n👑 *Status:* SUCCESSFULLY SECURED\n🎯 *Username:* @${data.username}\n\n📦 *Ownership Note:* Check your claimed stock using \`/my\` to instantly release and grab this username!`

                await bot.sendPhoto(data.user, photoBuffer, { caption: announcementText, parse_mode: "Markdown" })
                
            } catch (e) {
                console.error("Loop Sniper Error:", e.message)
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

console.log("🚀 BULLETPROOF INSTANT SNIPER ENGINE IS LIVE");
                                  
