require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")

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
let sessions = loadJSON("sessions.json", {})
let freeUsers = loadJSON("freeUsers.json", {})

// In-memory states for multi-step OTP login
let loginStates = {}

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
    save("sessions.json", sessions)
    save("freeUsers.json", freeUsers)
}

/* PREMIUM CHECK */
function isPremium(id) {
    if (String(id) === OWNER_ID) return true
    return users[id] && users[id].active
}

/* START COMMAND */
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

        if (data.startsWith("approve_")) {
            let userId = data.split("_")[1]
            users[userId] = { active: true }
            saveAll()

            await bot.sendMessage(
                userId,
                `✅ Premium Activated\n\nUse /login to link your account.`
            )
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

        if (data.startsWith("deny_")) {
            let userId = data.split("_")[1]
            await bot.sendMessage(userId, `❌ Payment Declined`)
            return bot.deleteMessage(q.message.chat.id, q.message.message_id)
        }

    } catch (e) {
        console.error("Callback Error:", e)
    }
})

/* NEW OTP LOGIN HANDLER */
bot.onText(/\/login/, async (msg) => {
    const userId = msg.from.id;
    loginStates[userId] = { step: "AWAITING_NUMBER" };
    
    bot.sendMessage(
        msg.chat.id,
        `📱 Please send your Telegram Phone Number with Country Code.\n\nExample: \`+919876543210\``,
        { parse_mode: "Markdown", reply_markup: { force_reply: true } }
    )
})

/* DYNAMIC MESSAGE HANDLER FOR STEPS (NUMBER -> OTP) */
bot.on("message", async (msg) => {
    try {
        const userId = msg.from.id
        const text = msg.text ? msg.text.trim() : ""
        const state = loginStates[userId]

        if (!state) return; // Exit if user is not in a login flow

        // STEP 1: Process Phone Number & Send OTP via GramJS
        if (state.step === "AWAITING_NUMBER") {
            if (!text.startsWith("+")) {
                return bot.sendMessage(msg.chat.id, "❌ Invalid format. Please include country code starting with +")
            }

            await bot.sendMessage(msg.chat.id, "⏳ Requesting OTP from Telegram... Please wait.")
            
            const client = new TelegramClient(
                new StringSession(""),
                Number(process.env.API_ID),
                process.env.API_HASH,
                { connectionRetries: 3 }
            )

            await client.connect()

            try {
                const { phoneCodeHash } = await client.sendCode(
                    { apiId: Number(process.env.API_ID), apiHash: process.env.API_HASH },
                    text
                )

                // Save details to state memory
                loginStates[userId] = {
                    step: "AWAITING_OTP",
                    phoneNumber: text,
                    phoneCodeHash: phoneCodeHash,
                    client: client
                }

                return bot.sendMessage(
                    msg.chat.id,
                    `📩 OTP Sent successfully to your Telegram account!\n\nPlease reply with the OTP code.`,
                    { reply_markup: { force_reply: true } }
                )
            } catch (err) {
                await client.disconnect()
                delete loginStates[userId]
                return bot.sendMessage(msg.chat.id, `❌ Failed to send code: ${err.message}`)
            }
        }

        // STEP 2: Process OTP & Generate Session String
        if (state.step === "AWAITING_OTP") {
            const client = state.client
            await bot.sendMessage(msg.chat.id, "⚡ Verifying OTP and signing in...")

            try {
                await client.signIn({
                    phoneNumber: state.phoneNumber,
                    phoneCodeHash: state.phoneCodeHash,
                    phoneCode: text
                })

                // Create persistent Session String
                const sessionString = client.session.save()
                sessions[userId] = sessionString
                saveAll()

                delete loginStates[userId]
                await bot.sendMessage(msg.chat.id, `✅ Account successfully linked!\n\nNow you can monitor usernames using:\n\`/add username\``)
                await client.disconnect()
            } catch (err) {
                // Check if 2-Step Verification password is required
                if (err.message.includes("PASSWORD_MISSING")) {
                    loginStates[userId].step = "AWAITING_PASSWORD"
                    return bot.sendMessage(
                        msg.chat.id,
                        `🔒 Your account has 2-Step Verification enabled. Please reply with your Cloud Password:`,
                        { reply_markup: { force_reply: true } }
                    )
                } else {
                    await client.disconnect()
                    delete loginStates[userId]
                    return bot.sendMessage(msg.chat.id, `❌ Verification Failed: ${err.message}\n\nPlease try /login again.`)
                }
            }
        }

        // STEP 3: Handle Password if 2FA is active
        if (state.step === "AWAITING_PASSWORD") {
            const client = state.client
            try {
                await client.signIn({
                    password: text
                })

                const sessionString = client.session.save()
                sessions[userId] = sessionString
                saveAll()

                delete loginStates[userId]
                await bot.sendMessage(msg.chat.id, `✅ Account successfully linked with 2FA Check!\n\nNow use:\n\`/add username\``)
                await client.disconnect()
            } catch (err) {
                await client.disconnect()
                delete loginStates[userId]
                return bot.sendMessage(msg.chat.id, `❌ Incorrect Password or Error: ${err.message}\n\nPlease retry via /login.`)
            }
        }

    } catch (e) {
        console.error("State Processing Error:", e)
    }
})

/* ADD COMMAND */
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

/* PLAN COMMAND */
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

/* HELP COMMAND */
bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, `📚 Commands\n\n/login\n/add username\n/plan\n/help`)
})

/* SCREENSHOT PAYMENT */
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

/* AUTO CLAIM SNIPER LOOP */
setInterval(async () => {
    if (monitor.length === 0) return

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
                    
                    await client.invoke(
                        new Api.account.UpdateUsername({ username: data.username })
                    )

                    if (!owned.includes(data.username)) {
                        owned.push(data.username)
                    }

                    // Remove successfully claimed item from loop queue immediately
                    monitor.splice(i, 1)
                    saveAll()

                    await bot.sendMessage(data.user, `🎉 Claimed @${data.username}`)
                    await client.disconnect()
                }
            } catch (e) {
                console.error("Claiming Error for " + data.username + ":", e.message)
            }
        }
        await new Promise(resolve => setTimeout(resolve, 500))
    }
}, 15000)

/* CRASH PROTECTION MANAGEMENT */
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection Saved:", reason)
})
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception Saved:", err)
})
bot.on("polling_error", (err) => {
    console.error("Polling Error Saved:", err.message)
})

console.log("🚀 PRODUCTION BOT READY WITH DIRECT PHONE/OTP LOGIN SYSTEM")
    
