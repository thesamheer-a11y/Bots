require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")

const bot = new TelegramBot(process.env.BOT_TOKEN, {
polling: true
})

const OWNER_ID = 8715707181

let users = {}
let monitor = []
let owned = []

/* START */

bot.onText(/\/start/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`🚀 Welcome To Username Manager Bot

⚡ Features:
• Username Monitoring
• Transfer System
• Premium Plans
• Instant Alerts

💎 Use /plan To Buy Premium`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "🇮🇳 Hindi",
callback_data: "hindi"
},
{
text: "🇬🇧 English",
callback_data: "english"
}
]
]
}
}
)

})

/* LANGUAGE */

bot.on("callback_query", async (q) => {

const data = q.data

if(data == "hindi"){

bot.sendMessage(
q.message.chat.id,
"🤖 Bot Use Karne Ke Liye Premium Plan Zaruri Hai\n\nUse : /plan"
)

}

if(data == "english"){

bot.sendMessage(
q.message.chat.id,
"🤖 Premium Plan Required\n\nUse : /plan"
)

}

/* APPROVE */

if(data.startsWith("approve_")){

let userId = data.split("_")[1]

users[userId] = {
active: true
}

bot.sendMessage(
userId,
"✅ Payment Approved\n\n🎉 Subscription Activated"
)

}

/* DENY */

if(data.startsWith("deny_")){

let userId = data.split("_")[1]

bot.sendMessage(
userId,
"❌ Payment Declined"
)

}

/* TRANSFER */

if(data.startsWith("transfer_")){

let split = data.split("_")

let username = split[1]
let target = split[2]

bot.sendMessage(
q.message.chat.id,
`✅ Transfer Started

👤 Username : @${username}
🆔 User : ${target}`
)

}

})

/* PLAN */

bot.onText(/\/plan/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`💎 Premium Plans

₹99 → 3 Days
₹199 → 7 Days
₹349 → 15 Days
₹599 → 30 Days
₹999 → 3 Months
₹1799 → 6 Months
₹3000 → Permanent

💳 UPI : itzrao@fam

📤 Send Payment Screenshot`
)

})

/* PHOTO */

bot.on("photo", async (msg) => {

bot.sendPhoto(
OWNER_ID,
msg.photo[msg.photo.length - 1].file_id,
{
caption:
`💸 New Payment

👤 User : ${msg.from.id}`,
reply_markup: {
inline_keyboard: [
[
{
text: "✅ Approve",
callback_data: `approve_${msg.from.id}`
},
{
text: "❌ Deny",
callback_data: `deny_${msg.from.id}`
}
]
]
}
}
)

bot.sendMessage(
msg.chat.id,
"📨 Screenshot Sent To Manager"
)

})

/* ADD */

bot.onText(/\/add (.+)/, async (msg, match) => {

if(msg.from.id != OWNER_ID) return

let username = match[1]

monitor.push(username)

bot.sendMessage(
msg.chat.id,
`✅ Monitoring Started

👤 ${username}`
)

})

/* WHO */

bot.onText(/\/who/, async (msg) => {

if(msg.from.id != OWNER_ID) return

if(monitor.length == 0){
return bot.sendMessage(
msg.chat.id,
"No Usernames"
)
}

let text = "👀 Monitoring:\n\n"

monitor.forEach((u,i)=>{
text += `${i+1}. ${u}\n`
})

bot.sendMessage(msg.chat.id,text)

})

/* LIST */

bot.onText(/\/list/, async (msg) => {

if(msg.from.id != OWNER_ID) return

if(owned.length == 0){
return bot.sendMessage(
msg.chat.id,
"No Owned Usernames"
)
}

let text = "📦 Owned:\n\n"

owned.forEach((u,i)=>{
text += `${i+1}. ${u}\n`
})

bot.sendMessage(msg.chat.id,text)

})

/* TRANSFER */

bot.onText(/\/transfer (.+)/, async (msg, match) => {

let target = match[1]

let keyboard = []

for(let i=0;i<owned.length;i+=5){

keyboard.push(
owned
.slice(i,i+5)
.map(x => ({
text: x,
callback_data:
`transfer_${x}_${target}`
}))
)

}

bot.sendMessage(
msg.chat.id,
"📦 Select Username",
{
reply_markup: {
inline_keyboard: keyboard
}
}
)

})

/* HELP */

bot.onText(/\/help/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`📚 Commands

/start
/plan
/add
/who
/list
/transfer
/help`
)

})

console.log("BOT STARTED")
