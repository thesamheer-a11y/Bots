require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")

const { TelegramClient, Api } = require("telegram")
const { StringSession } = require("telegram/sessions")

const bot = new TelegramBot(process.env.BOT_TOKEN, {
polling: true
})

const OWNER_ID = "8715707181"

/* DATABASE */

let users = fs.existsSync("users.json")
? JSON.parse(fs.readFileSync("users.json"))
: {}

let monitor = fs.existsSync("monitor.json")
? JSON.parse(fs.readFileSync("monitor.json"))
: []

let owned = fs.existsSync("owned.json")
? JSON.parse(fs.readFileSync("owned.json"))
: []

let sessions = fs.existsSync("sessions.json")
? JSON.parse(fs.readFileSync("sessions.json"))
: {}

let freeUsers = fs.existsSync("freeUsers.json")
? JSON.parse(fs.readFileSync("freeUsers.json"))
: {}

/* SAVE */

function saveData(){

fs.writeFileSync(
"users.json",
JSON.stringify(users,null,2)
)

fs.writeFileSync(
"monitor.json",
JSON.stringify(monitor,null,2)
)

fs.writeFileSync(
"owned.json",
JSON.stringify(owned,null,2)
)

fs.writeFileSync(
"sessions.json",
JSON.stringify(sessions,null,2)
)

fs.writeFileSync(
"freeUsers.json",
JSON.stringify(freeUsers,null,2)
)

}

/* PREMIUM */

function isPremium(id){

if(String(id) == OWNER_ID) return true

return users[id] && users[id].active

}

/* START */

bot.onText(/\/start/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`🚀 Username Manager

⚡ Auto Username Claim Bot

• Auto Claim
• Fast Monitoring
• Premium System

👤 Free: 1 Username
💎 Premium: Unlimited`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "🇮🇳 Hindi",
callback_data: "lang_hindi"
},
{
text: "🇵🇰 Punjabi",
callback_data: "lang_punjabi"
}
]
]
}
}
)

})

/* CALLBACK */

bot.on("callback_query", async (q) => {

const data = q.data

/* HINDI */

if(data == "lang_hindi"){

bot.editMessageText(
`🚀 यूजरनेम मैनेजर

⚡ ऑटो यूजरनेम क्लेम बॉट

• ऑटो क्लेम
• फास्ट मॉनिटरिंग
• प्रीमियम सिस्टम

👤 फ्री: 1 यूजरनेम
💎 प्रीमियम: अनलिमिटेड`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id,
reply_markup: {
inline_keyboard: [
[
{
text: "💎 प्लान्स",
callback_data: "payment"
}
]
]
}
}
)

}

/* PUNJABI */

if(data == "lang_punjabi"){

bot.editMessageText(
`🚀 ਯੂਜ਼ਰਨੇਮ ਮੈਨੇਜਰ

⚡ ਆਟੋ ਯੂਜ਼ਰਨੇਮ ਕਲੇਮ ਬੋਟ

• ਆਟੋ ਕਲੇਮ
• ਫਾਸਟ ਮਾਨੀਟਰਿੰਗ
• ਪ੍ਰੀਮੀਅਮ ਸਿਸਟਮ

👤 ਫ੍ਰੀ: 1 ਯੂਜ਼ਰਨੇਮ
💎 ਪ੍ਰੀਮੀਅਮ: ਅਨਲਿਮਿਟਡ`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id,
reply_markup: {
inline_keyboard: [
[
{
text: "💎 Plans",
callback_data: "payment"
}
]
]
}
}
)

}

/* PAYMENT */

if(data == "payment"){

bot.editMessageText(
`💎 Premium Plans

3D • ₹99
7D • ₹199
15D • ₹349
30D • ₹599
3M • ₹999
Life • ₹3000

💳 UPI:
\`itzrao@fam\`

📸 Send Screenshot After Payment.`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id,
parse_mode: "Markdown"
}
)

}

/* APPROVE */

if(data.startsWith("approve_")){

let userId = data.split("_")[1]

users[userId] = {
active: true
}

saveData()

await bot.sendMessage(
userId,
`✅ Premium Activated`
)

try{

await bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}catch(e){}

}

/* DENY */

if(data.startsWith("deny_")){

let userId = data.split("_")[1]

await bot.sendMessage(
userId,
`❌ Payment Declined`
)

try{

await bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}catch(e){}

}

})

/* LOGIN */

bot.onText(/\/login/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`🔐 Send String Session`,
{
reply_markup: {
force_reply: true
}
}
)

})

/* SAVE SESSION */

bot.on("message", async (msg) => {

if(
msg.reply_to_message &&
msg.reply_to_message.text &&
msg.reply_to_message.text.includes("String Session")
){

sessions[msg.from.id] = msg.text

saveData()

bot.sendMessage(
msg.chat.id,
`✅ Account Linked`
)

}

})

/* ADD */

bot.onText(/\/add (.+)/, async (msg, match) => {

let username = match[1]
.replace("@","")
.trim()
.toLowerCase()

/* LOGIN CHECK */

if(
String(msg.from.id) != OWNER_ID &&
!sessions[msg.from.id]
){

return bot.sendMessage(
msg.chat.id,
`🔐 Login Required

Use:
/login`
)

}

/* FREE LIMIT */

if(
!isPremium(msg.from.id) &&
String(msg.from.id) != OWNER_ID
){

if(!freeUsers[msg.from.id]){

freeUsers[msg.from.id] = []

}

if(freeUsers[msg.from.id].length >= 1){

return bot.sendMessage(
msg.chat.id,
`⚠️ Free Limit Reached

💎 Upgrade:
/plan`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Buy Premium",
callback_data: "payment"
}
]
]
}
}
)

}

freeUsers[msg.from.id].push(username)

}

/* DUPLICATE */

let exists = monitor.find(
x => x.username == username
)

if(exists){

return bot.sendMessage(
msg.chat.id,
`⚠️ Already Monitoring`
)

}

/* ADD */

monitor.push({
user: msg.from.id,
username: username
})

saveData()

bot.sendMessage(
msg.chat.id,
`✅ Monitoring Started

👤 @${username}`
)

})

/* PLAN */

bot.onText(/\/plan/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`💎 Premium Plans

3D • ₹99
7D • ₹199
15D • ₹349
30D • ₹599
3M • ₹999
Life • ₹3000`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Buy Premium",
callback_data: "payment"
}
]
]
}
}
)

})

/* FREE */

bot.onText(/\/free/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`👤 Free Plan

• 1 Username Limit
• Basic Monitoring

💎 Premium:
Unlimited Usernames`
)

})

/* HELP */

bot.onText(/\/help/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`📚 Commands

/login - Link Account
/add user - Monitor
/free - Free Plan
/plan - Premium
/help - Commands`
)

})

/* PHOTO */

bot.on("photo", async (msg) => {

await bot.sendPhoto(
OWNER_ID,
msg.photo[msg.photo.length - 1].file_id,
{
caption:
`💳 New Payment

👤 ${msg.from.id}`,
reply_markup: {
inline_keyboard: [
[
{
text: "Approve",
callback_data: `approve_${msg.from.id}`
},
{
text: "Deny",
callback_data: `deny_${msg.from.id}`
}
]
]
}
}
)

bot.sendMessage(
msg.chat.id,
`📸 Screenshot Sent`
)

})

/* AUTO CLAIM */

setInterval(async()=>{

for(let data of monitor){

let username = data.username
let owner = data.user

try{

await bot.getChat(
"@" + username
)

}catch(err){

if(
err.response &&
err.response.body.description
.includes("chat not found")
){

try{

let stringSession =
new StringSession(
sessions[owner]
)

const client =
new TelegramClient(
stringSession,
Number(process.env.API_ID),
process.env.API_HASH,
{
connectionRetries: 5
}
)

await client.connect()

await client.invoke(
new Api.account.UpdateUsername({
username: username
})
)

owned.push(username)

saveData()

await bot.sendMessage(
owner,
`🎉 Username Claimed

👤 @${username}`
)

await bot.sendMessage(
OWNER_ID,
`✅ Claimed

👤 @${username}`
)

}catch(claimErr){

await bot.sendMessage(
owner,
`❌ Claim Failed

👤 @${username}`
)

}

}

}

}

},4000)

/* ERROR */

bot.on(
"polling_error",
console.log
)

process.on(
"unhandledRejection",
console.log
)

process.on(
"uncaughtException",
console.log
)

console.log("BOT STARTED")
