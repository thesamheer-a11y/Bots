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

/* SAFE JSON LOAD */

function loadJSON(file, def){

try{

if(fs.existsSync(file)){

return JSON.parse(
fs.readFileSync(file)
)

}

return def

}catch{

return def

}

}

/* DATABASE */

let users = loadJSON(
"users.json",
{}
)

let monitor = loadJSON(
"monitor.json",
[]
)

let owned = loadJSON(
"owned.json",
[]
)

let sessions = loadJSON(
"sessions.json",
{}
)

let freeUsers = loadJSON(
"freeUsers.json",
{}
)

/* SAVE */

function save(file,data){

fs.writeFileSync(
file,
JSON.stringify(data,null,2)
)

}

function saveAll(){

save("users.json",users)
save("monitor.json",monitor)
save("owned.json",owned)
save("sessions.json",sessions)
save("freeUsers.json",freeUsers)

}

/* PREMIUM */

function isPremium(id){

if(String(id) === OWNER_ID){
return true
}

return users[id] && users[id].active

}

/* START */

bot.onText(/\/start/, async(msg)=>{

bot.sendMessage(
msg.chat.id,
`🚀 Username Manager

⚡ Auto Username Claim Bot

👤 Free → 1 Username
💎 Premium → Unlimited`,
{
reply_markup:{
inline_keyboard:[
[
{
text:"🇮🇳 Hindi",
callback_data:"lang_hindi"
},
{
text:"🇵🇰 Punjabi",
callback_data:"lang_punjabi"
}
],
[
{
text:"💎 Plans",
callback_data:"payment"
}
]
]
}
}
)

})

/* CALLBACKS */

bot.on("callback_query", async(q)=>{

try{

const data = q.data

if(data === "lang_hindi"){

return bot.editMessageText(
`🚀 यूजरनेम मैनेजर

⚡ ऑटो यूजरनेम क्लेम बॉट

👤 फ्री → 1 यूजरनेम
💎 प्रीमियम → अनलिमिटेड`,
{
chat_id:q.message.chat.id,
message_id:q.message.message_id,
reply_markup:{
inline_keyboard:[
[
{
text:"🇮🇳 Hindi",
callback_data:"lang_hindi"
},
{
text:"🇵🇰 Punjabi",
callback_data:"lang_punjabi"
}
],
[
{
text:"💎 प्लान्स",
callback_data:"payment"
}
]
]
}
}
)

}

if(data === "lang_punjabi"){

return bot.editMessageText(
`🚀 ਯੂਜ਼ਰਨੇਮ ਮੈਨੇਜਰ

⚡ ਆਟੋ ਯੂਜ਼ਰਨੇਮ ਕਲੇਮ ਬੋਟ

👤 ਫ੍ਰੀ → 1 ਯੂਜ਼ਰਨੇਮ
💎 ਪ੍ਰੀਮੀਅਮ → ਅਨਲਿਮਿਟਡ`,
{
chat_id:q.message.chat.id,
message_id:q.message.message_id,
reply_markup:{
inline_keyboard:[
[
{
text:"🇮🇳 Hindi",
callback_data:"lang_hindi"
},
{
text:"🇵🇰 Punjabi",
callback_data:"lang_punjabi"
}
],
[
{
text:"💎 Plans",
callback_data:"payment"
}
]
]
}
}
)

}

if(data === "payment"){

return bot.editMessageText(
`💎 Premium Plans

3D → ₹99
7D → ₹199
15D → ₹349
30D → ₹599
3M → ₹999
Life → ₹3000

💳 UPI:
\`itzrao@fam\`

📸 Send Screenshot`,
{
chat_id:q.message.chat.id,
message_id:q.message.message_id,
parse_mode:"Markdown"
}
)

}

/* APPROVE */

if(data.startsWith("approve_")){

let userId = data.split("_")[1]

users[userId] = {
active:true
}

saveAll()

await bot.sendMessage(
userId,
`✅ Premium Activated

/login
Then Send Session

/add username`
)

return bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}

/* DENY */

if(data.startsWith("deny_")){

let userId = data.split("_")[1]

await bot.sendMessage(
userId,
`❌ Payment Declined`
)

return bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}

}catch(e){

console.log(e)

}

})

/* LOGIN */

bot.onText(/\/login/, async(msg)=>{

bot.sendMessage(
msg.chat.id,
`🔐 Send String Session`,
{
reply_markup:{
force_reply:true
}
}
)

})

/* SAVE SESSION */

bot.on("message", async(msg)=>{

try{

if(
msg.reply_to_message &&
msg.reply_to_message.text &&
msg.reply_to_message.text.includes("String Session")
){

sessions[msg.from.id] =
msg.text.trim()

saveAll()

bot.sendMessage(
msg.chat.id,
`✅ Account Linked`
)

}

}catch(e){

console.log(e)

}

})

/* ADD */

bot.onText(/\/add (.+)/, async(msg,match)=>{

try{

let username = match[1]
.replace("@","")
.trim()
.toLowerCase()

if(
String(msg.from.id) !== OWNER_ID &&
!sessions[msg.from.id]
){

return bot.sendMessage(
msg.chat.id,
`🔐 Login First

/login`
)

}

if(
!isPremium(msg.from.id) &&
String(msg.from.id) !== OWNER_ID
){

if(!freeUsers[msg.from.id]){

freeUsers[msg.from.id] = []

}

if(freeUsers[msg.from.id].length >= 1){

return bot.sendMessage(
msg.chat.id,
`⚠️ Free Limit Reached`
)

}

freeUsers[msg.from.id]
.push(username)

}

let exists = monitor.find(
x=>x.username === username
)

if(exists){

return bot.sendMessage(
msg.chat.id,
`⚠️ Already Monitoring`
)

}

monitor.push({
user:msg.from.id,
username:username
})

saveAll()

bot.sendMessage(
msg.chat.id,
`✅ Monitoring Started

@${username}`
)

}catch(e){

console.log(e)

}

})

/* PLAN */

bot.onText(/\/plan/, async(msg)=>{

bot.sendMessage(
msg.chat.id,
`💎 Premium Plans

3D → ₹99
7D → ₹199
15D → ₹349
30D → ₹599
3M → ₹999
Life → ₹3000`,
{
reply_markup:{
inline_keyboard:[
[
{
text:"Buy Premium",
callback_data:"payment"
}
]
]
}
}
)

})

/* HELP */

bot.onText(/\/help/, async(msg)=>{

bot.sendMessage(
msg.chat.id,
`📚 Commands

/login
/add username
/free
/plan
/help`
)

})

/* PAYMENT PHOTO */

bot.on("photo", async(msg)=>{

try{

await bot.sendPhoto(
OWNER_ID,
msg.photo[
msg.photo.length - 1
].file_id,
{
caption:
`💳 Payment

👤 ${msg.from.id}`,
reply_markup:{
inline_keyboard:[
[
{
text:"Approve",
callback_data:
`approve_${msg.from.id}`
},
{
text:"Deny",
callback_data:
`deny_${msg.from.id}`
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

}catch(e){

console.log(e)

}

})

/* AUTO CLAIM */

setInterval(async()=>{

for(const data of monitor){

try{

await bot.getChat(
"@" + data.username
)

}catch(err){

try{

if(
err.response &&
err.response.body &&
err.response.body.description &&
err.response.body.description
.includes("chat not found")
){

if(!sessions[data.user]){
continue
}

const client =
new TelegramClient(
new StringSession(
sessions[data.user]
),
Number(process.env.API_ID),
process.env.API_HASH,
{
connectionRetries:3
}
)

await client.connect()

await client.invoke(
new Api.account.UpdateUsername({
username:data.username
})
)

if(
!owned.includes(data.username)
){

owned.push(data.username)

saveAll()

}

await bot.sendMessage(
data.user,
`🎉 Claimed @${data.username}`
)

await client.disconnect()

}

}catch(e){

console.log(e)

}

}

}

},10000)

/* ERRORS */

process.on(
"unhandledRejection",
console.log
)

process.on(
"uncaughtException",
console.log
)

bot.on(
"polling_error",
console.log
)

console.log("BOT STARTED")
