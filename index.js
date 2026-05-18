require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")
const { createCanvas } = require("canvas")

/* TELEGRAM MTPROTO IMPORTS */
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

let mtProtoClient = null;
let isScannerRunning = false;

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

/* DATABASE INSTANCES */
let users = loadJSON("users.json", {})
let monitor = loadJSON("monitor.json", [])
let owned = loadJSON("owned.json", []) 
let freeUsers = loadJSON("freeUsers.json", {})

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

/* PREMIUM VALIDATION WITH EXPIRY CHECK */
function isPremium(id) {
    if (String(id) === OWNER_ID) return true
    if (users[id] && users[id].active) {
        if (users[id].expiry && Date.now() > users[id].expiry) {
            users[id].active = false
            saveAll()
            return false
        }
        return true
    }
    return false
}

function getExpiryTime(days) {
    return Date.now() + (days * 24 * 60 * 60 * 1000)
}

/* PHOTO GENERATOR */
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

/* HIGH-SPEED CLAIM ENGINE (WITH 1-MINUTE DELAYED NOTIFICATION MODULE) */
async function executeClaim(username, userId) {
    if (!mtProtoClient || !mtProtoClient.connected) return false;
    
    try {
        const createChannelResult = await mtProtoClient.invoke(
            new Api.channels.CreateChannel({
                title: `Reserved Space ${username}`,
                about: `Secured by @${BOT_USERNAME}`,
                broadcast: true,
                megagroup: false
            })
        )

        const channelId = createChannelResult.chats[0].id

        await mtProtoClient.invoke(
            new Api.channels.UpdateUsername({
                channel: channelId,
                username: username
            })
        )

        let uniqueDeletionId = Math.floor(Math.random() * 100000) + 1

        owned.push({
            username: username,
            claimedBy: userId,
            channelId: channelId.toString(),
            dId: uniqueDeletionId
        })
        saveAll()

        // CRITICAL FIX: Claim instantly ho gaya hai, par notification system 1 minute (60000ms) baad chalega taaki crash na ho.
        setTimeout(async () => {
            try {
                const photoBuffer = generateClaimPhoto(username)
                const announcementText = `🔥 *BOOM! USERNAME SNIPED BY @${BOT_USERNAME}* 🔥\n\n👑 *Status:* SUCCESSFULLY SECURED\n🎯 *Username:* @${username}\n\n📦 *Ownership Note:* Check your claimed stock using \`/my\` to instantly release and grab this username!`
                
                await bot.sendPhoto(userId, photoBuffer, { caption: announcementText, parse_mode: "Markdown" }).catch(() => {});
            } catch (mediaErr) {
                console.error("Delayed notification rendering alert:", mediaErr.message)
            }
        }, 60000);

        return true
    } catch (e) {
        console.error(`Sniper Execution Failure for @${username}:`, e.message)
        return false
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
📦 To view your successfully claimed stock, use: \`/my\`
ℹ️ Check your account status: \`/status\``,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "💎 Buy Premium Slots", callback_data: "payment" }]]
            }
        }
    )
})

/* ADD ENTRY CONTROLLER */
bot.onText(/\/add (.+)/, async (msg, match) => {
    try {
        let username = match[1].replace("@", "").trim().toLowerCase()
        const userId = msg.from.id

        if(!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
            return bot.sendMessage(msg.chat.id, `⚠️ *Invalid Username Format!* Use alphanumeric and underscores only (min 4 characters).`, { parse_mode: "Markdown" })
        }

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

        if (isCurrentlyAvailable) {
            bot.sendMessage(msg.chat.id, `⚡ *Target is free! Attempting instant claim...*`, { parse_mode: "Markdown" })
            let success = await executeClaim(username, userId)
            if (success) return;
            bot.sendMessage(msg.chat.id, `❌ *Instant claim collision. Syncing to automatic track engine...*`, { parse_mode: "Markdown" })
        }

        let randomId = Math.floor(Math.random() * 100000) + 1
        monitor.push({ user: userId, username: username, dId: randomId })
        
        if (!isPremium(userId) && String(userId) !== OWNER_ID) {
            freeUsers[userId].push(username)
        }
        
        saveAll()
        bot.sendMessage(msg.chat.id, `🎯 *Target Hooked Successfully!*\n\nBot sniper engine is now watching: *@${username}*`, { parse_mode: "Markdown" })

    } catch (e) {
        console.error("Add Logic Error:", e)
    }
})

/* TRACK DISPLAY */
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

/* USER STATUS COMMAND */
bot.onText(/\/status/, async (msg) => {
    const userId = msg.from.id
    const premiumActive = isPremium(userId)
    const activeTargets = monitor.filter(x => x.user === userId).length

    let statusMsg = `👤 *Account Profile Status*\n\n`
    statusMsg += `🆔 User ID: \`${userId}\`\n`
    statusMsg += `👑 Account Type: ${premiumActive ? "💎 *Premium Tier*" : "📁 *Free Tier*"}\n`
    statusMsg += `🎯 Active Trackers: \`${activeTargets}\` ${premiumActive ? "/ Unlimited" : "/ 1"}\n`
    
    if (premiumActive && users[userId] && users[userId].expiry) {
        const remainingTime = new Date(users[userId].expiry).toLocaleString()
        statusMsg += `📆 Plan Valid Until: \`${remainingTime}\`\n`
    } else if (!premiumActive) {
        statusMsg += `\n💡 Upgrade your account using /plan to get high speed slots and track unlimited usernames.`
    }

    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: "Markdown" })
})

/* STOCK DISCOVERY */
bot.onText(/\/my/, async (msg) => {
    const userId = msg.from.id
    const userClaims = owned.filter(x => x.claimedBy === userId)

    if (userClaims.length === 0) {
        return bot.sendMessage(msg.chat.id, "❌ You don't have any successfully claimed usernames yet.")
    }

    let responseStr = `📦 *Your Successfully Secured Stock:*\n\n` +
                      `Tap the corresponding command next to your username to delete the reserve channel and claim it yourself:\n\n`

    userClaims.forEach(x => {
        if (!x.dId) x.dId = Math.floor(Math.random() * 100000) + 1
        responseStr += `• @${x.username} ➔ /delete_${x.dId}\n`
    })

    saveAll()
    bot.sendMessage(msg.chat.id, responseStr)
})

/* DISPOSAL MODULE */
bot.onText(/\/delete_(.+)/, async (msg, match) => {
    try {
        const targetId = Number(match[1])
        const userId = msg.from.id

        const index = owned.findIndex(x => x.claimedBy === userId && x.dId === targetId)
        if (index === -1) {
            return bot.sendMessage(msg.chat.id, "Error: Selected entry is invalid or has already been dropped.")
        }

        if (!mtProtoClient || !mtProtoClient.connected) {
            return bot.sendMessage(msg.chat.id, "System Engine busy, please try again in a moment.")
        }

        const record = owned[index]
        const TargetUserHandle = record.username
        const TargetChannelUID = record.channelId

        try {
            await mtProtoClient.invoke(
                new Api.channels.DeleteChannel({
                    channel: TargetChannelUID
                })
            )

            owned.splice(index, 1)
            if (freeUsers[userId]) {
                freeUsers[userId] = freeUsers[userId].filter(u => u !== TargetUserHandle)
            }
            saveAll()

            bot.sendMessage(
                msg.chat.id,
                `Success! I have successfully deleted the reserve channel holding @${TargetUserHandle}. You can now completely own and assign the username to your account immediately!`
            )
        } catch (channelErr) {
            bot.sendMessage(msg.chat.id, "Operation Error: " + channelErr.message)
        }
    } catch (e) {
        console.error("Disposal Fail Safe Catch:", e)
    }
})

/* PLAN MANAGEMENT */
bot.onText(/\/plan/, async (msg) => {
    bot.sendMessage(msg.chat.id, `💎 *Premium Plans Slots & Features*

• Unlock unlimited monitoring targets.
• Real-time immediate claim loop.
• High-priority server resources.

📊 *Pricing Table:*
3 Days ➔ ₹99
7 Days ➔ ₹199
15 Days ➔ ₹349
30 Days ➔ ₹599
3 Months ➔ ₹999
Lifetime Access ➔ ₹3000`, { reply_markup: { inline_keyboard: [[{ text: "💳 Pay & Activate Premium", callback_data: "payment" }]] }, parse_mode: "Markdown" })
})

/* ADMIN COMMANDS */
bot.onText(/\/stats/, async (msg) => {
    if (String(msg.from.id) !== OWNER_ID) return;
    const totalUsers = Object.keys(users).length;
    const totalMonitors = monitor.length;
    const totalClaims = owned.length;
    
    bot.sendMessage(msg.chat.id, `📊 *System Metrics Dashboard* (Admin Only)\n\n• Total Registered Premium Profiles: \`${totalUsers}\`\n• Active Loop Monitor Targets: \`${totalMonitors}\`\n• Total Successfully Secured Stock: \`${totalClaims}\``, { parse_mode: "Markdown" })
})

bot.onText(/\/clean/, async (msg) => {
    if (String(msg.from.id) !== OWNER_ID) return;
    let expiredCount = 0;
    
    for (const id in users) {
        if (users[id].expiry && Date.now() > users[id].expiry) {
            users[id].active = false;
            expiredCount++;
        }
    }
    saveAll();
    bot.sendMessage(msg.chat.id, `🧹 *Database Garbage Collection Completed!* Cleaned up \`${expiredCount}\` expired accounts.`, { parse_mode: "Markdown" })
})

/* CALLBACK HANDLER */
bot.on("callback_query", async (q) => {
    try {
        const data = q.data
        const chat_id = q.message.chat.id
        const message_id = q.message.message_id

        if (data === "payment") {
            return bot.editMessageText(`💎 *Premium Plans Slots*\n\n3D → ₹99\n7D → ₹199\n15D → ₹349\n30D → ₹599\n3M → ₹999\nLife → ₹3000\n\n💳 *UPI ID:* \`itzrao@fam\`\n\n📸 Screenshot yahan send karein!`, { chat_id, message_id, parse_mode: "Markdown" })
        }

        const actionMapping = {
            "p3d_": { days: 3, label: "3 Days" },
            "p7d_": { days: 7, label: "7 Days" },
            "p15d_": { days: 15, label: "15 Days" },
            "p30d_": { days: 30, label: "30 Days" },
            "p3m_": { days: 90, label: "3 Months" },
            "plife_": { days: 3650, label: "Lifetime" }
        }

        for (const prefix in actionMapping) {
            if (data.startsWith(prefix)) {
                let tUid = data.split("_")[1]
                const config = actionMapping[prefix]
                users[tUid] = { active: true, expiry: getExpiryTime(config.days) }
                saveAll()
                await bot.sendMessage(tUid, `✅ *Premium Plan Activated for ${config.label}!*`, { parse_mode: "Markdown" })
                return bot.editMessageCaption(`✅ Approved ${config.label} for User: \`${tUid}\``, { chat_id, message_id })
            }
        }

        if (data.startsWith("deny_")) {
            let tUid = data.split("_")[1]
            await bot.sendMessage(tUid, `❌ *Payment Declined.* Entry rejected by admin.`)
            return bot.deleteMessage(chat_id, message_id)
        }
    } catch (e) {
        console.error("Callback handling crash protection:", e.message)
    }
})

/* SCREENSHOT HANDLER */
bot.on("photo", async (msg) => {
    try {
        const senderId = msg.from.id
        const fileId = msg.photo[msg.photo.length - 1].file_id

        const adminKeyboard = {
            inline_keyboard: [
                [{ text: "3 Days ⚡", callback_data: `p3d_${senderId}` }, { text: "7 Days ⚡", callback_data: `p7d_${senderId}` }],
                [{ text: "15 Days 🔥", callback_data: `p15d_${senderId}` }, { text: "30 Days 🔥", callback_data: `p30d_${senderId}` }],
                [{ text: "3 Months 👑", callback_data: `p3m_${senderId}` }, { text: "Lifetime 💎", callback_data: `plife_${senderId}` }],
                [{ text: "Deny ❌", callback_data: `deny_${senderId}` }]
            ]
        }

        await bot.sendPhoto(OWNER_ID, fileId, { 
            caption: `💳 *New Payment Screenshot Received*\n\n👤 User ID: \`${senderId}\`\n\nSelect the exact plan to activate below:`, 
            parse_mode: "Markdown", 
            reply_markup: adminKeyboard 
        })
        
        bot.sendMessage(msg.chat.id, `📸 *Receipt delivered successfully to Admin! Please wait for approval...*`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Photo handling runtime error:", e.message)
    }
})

/* REFACTORED SAFE QUEUE RUNNER */
async function dynamicScannerLoop() {
    if (isScannerRunning) return;
    isScannerRunning = true;

    while (true) {
        if (monitor.length > 0 && mtProtoClient && mtProtoClient.connected) {
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
                    let success = await executeClaim(data.username, data.user)
                    if (success) {
                        monitor.splice(i, 1)
                        saveAll()
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 350));
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/* SYSTEM BOOT */
async function initializeSystem() {
    if (!process.env.OWNER_SESSION || !process.env.API_ID || !process.env.API_HASH) {
        console.error("❌ Critical Error: MTProto environment configurations are missing!");
        process.exit(1);
    }
    
    console.log("⚡ Connecting global MTProto string session interface...");
    mtProtoClient = new TelegramClient(
        new StringSession(process.env.OWNER_SESSION), 
        Number(process.env.API_ID), 
        process.env.API_HASH, 
        { connectionRetries: 5 }
    )
    
    await mtProtoClient.connect()
    console.log("🚀 ALL FIXES ONLINE: AUTOMATED TIMED ENGINE RUNNING CLEAN");
    
    dynamicScannerLoop();
}

/* CRASH SE PROTECTION (Iske bina bot crash hota hai) */
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection unprevented:", reason);
})
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception caught clean:", err.message);
})
bot.on("polling_error", (error) => {
    // Polling errors ko silently catch karega bina bot band kiye
})

initializeSystem();
    
