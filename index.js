require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const fs = require("fs")

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
"freeUsers.json",
JSON.stringify(freeUsers,null,2)
)

}

/* PREMIUM CHECK */

function isPremium(id){

return users[id] && users[id].active

}

/* START */

bot.onText(/\/start/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`PREMIUM USERNAME MANAGER

━━━━━━━━━━━━━━━━━━

Professional Username
Monitoring & Claim System

━━━━━━━━━━━━━━━━━━

FEATURES

• Rare Username Monitoring
• Username Availability Alerts
• Username Transfer System
• Free & Premium Plans
• Secure Database
• Fast Monitoring System

━━━━━━━━━━━━━━━━━━

PLAN INFORMATION

Free Users
• 1 Username Monitoring

Premium Users
• Unlimited Monitoring
• Faster Alerts
• Premium Features

━━━━━━━━━━━━━━━━━━

SYSTEM STATUS

• Monitoring Online
• Database Connected
• Alert System Active

━━━━━━━━━━━━━━━━━━

Select Your Preferred Language.`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Hindi",
callback_data: "hindi"
},
{
text: "English",
callback_data: "english"
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

if(data == "hindi"){

bot.editMessageText(
`प्रीमियम यूजरनेम मैनेजर

━━━━━━━━━━━━━━━━━━

प्रोफेशनल यूजरनेम
मॉनिटरिंग सिस्टम

━━━━━━━━━━━━━━━━━━

फीचर्स

• रेयर यूजरनेम मॉनिटरिंग
• इंस्टेंट अलर्ट
• यूजरनेम ट्रांसफर
• फ्री और प्रीमियम प्लान
• सिक्योर सिस्टम

━━━━━━━━━━━━━━━━━━

फ्री यूजर
• सिर्फ 1 यूजरनेम

प्रीमियम यूजर
• अनलिमिटेड मॉनिटरिंग

━━━━━━━━━━━━━━━━━━

प्लान देखने के लिए:
/plan`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
)

}

/* ENGLISH */

if(data == "english"){

bot.editMessageText(
`PREMIUM USERNAME MANAGER

━━━━━━━━━━━━━━━━━━

Professional Username
Monitoring System

━━━━━━━━━━━━━━━━━━

FEATURES

• Rare Username Monitoring
• Instant Alerts
• Username Transfers
• Free & Premium Plans
• Secure Database

━━━━━━━━━━━━━━━━━━

FREE USERS
• 1 Username Monitoring

PREMIUM USERS
• Unlimited Monitoring

━━━━━━━━━━━━━━━━━━

To View Plans:
/plan`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
)

}

/* PAYMENT PAGE */

if(data == "make_payment"){

bot.editMessageText(
`PREMIUM MEMBERSHIP

━━━━━━━━━━━━━━━━━━

AVAILABLE PLANS

₹99   → 3 Days
₹199  → 7 Days
₹349  → 15 Days
₹599  → 30 Days
₹999  → 3 Months
₹1799 → 6 Months
₹3000 → Lifetime

━━━━━━━━━━━━━━━━━━

PAYMENT METHOD

UPI ID:
\`itzrao@fam\`

━━━━━━━━━━━━━━━━━━

After Payment:

1. Send Screenshot
2. Send Selected Plan

Example:
Paid ₹599 For Professional Plan

━━━━━━━━━━━━━━━━━━

Manager Usually Responds Quickly.`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id,
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: [
[
{
text: "Back",
callback_data: "back_plan"
}
]
]
}
}
)

}

/* BACK */

if(data == "back_plan"){

bot.editMessageText(
`PREMIUM MEMBERSHIP

━━━━━━━━━━━━━━━━━━

Starter Plan
• 3 Days Access
• ₹99

Basic Plan
• 7 Days Access
• ₹199

Advanced Plan
• 15 Days Access
• ₹349

Professional Plan
• 30 Days Access
• ₹599

Enterprise Plan
• 3 Months Access
• ₹999

Ultimate Plan
• 6 Months Access
• ₹1799

Lifetime Plan
• Permanent Access
• ₹3000`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id,
reply_markup: {
inline_keyboard: [
[
{
text: "Make Payment",
callback_data: "make_payment"
}
]
]
}
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
`PAYMENT APPROVED

━━━━━━━━━━━━━━━━━━

Premium Membership Activated Successfully.

You Now Have:
• Unlimited Monitoring
• Premium Features
• Faster Alerts

Use /help To Continue.`
)

await bot.editMessageCaption(
`PAYMENT APPROVED

User ID:
${userId}

Status:
Premium Activated`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
)

setTimeout(async()=>{

try{

await bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}catch(e){}

},2000)

}

/* DENY */

if(data.startsWith("deny_")){

let userId = data.split("_")[1]

await bot.sendMessage(
userId,
`PAYMENT DECLINED

━━━━━━━━━━━━━━━━━━

Payment Could Not Be Verified.

Please Send Clear Screenshot Again.`
)

await bot.editMessageCaption(
`PAYMENT DECLINED

User ID:
${userId}

Status:
Declined`,
{
chat_id: q.message.chat.id,
message_id: q.message.message_id
}
)

setTimeout(async()=>{

try{

await bot.deleteMessage(
q.message.chat.id,
q.message.message_id
)

}catch(e){}

},2000)

}

/* TRANSFER */

if(data.startsWith("transfer_")){

let split = data.split("_")

let username = split[1]
let target = split[2]

bot.sendMessage(
q.message.chat.id,
`TRANSFER PROCESS STARTED

━━━━━━━━━━━━━━━━━━

Username:
@${username}

Target:
${target}

Status:
Processing`
)

}

})

/* FREE PLAN */

bot.onText(/\/free/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`FREE PLAN

━━━━━━━━━━━━━━━━━━

FEATURES

• 1 Username Monitoring
• Basic Alerts
• Standard Access

━━━━━━━━━━━━━━━━━━

PREMIUM BENEFITS

• Unlimited Monitoring
• Faster Alerts
• Username Transfers
• Premium Features

━━━━━━━━━━━━━━━━━━

Upgrade To Premium
For Full Access.`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Upgrade Premium",
callback_data: "make_payment"
}
]
]
}
}
)

})

/* PLAN */

bot.onText(/\/plan/, async (msg) => {

bot.sendMessage(
msg.chat.id,
`PREMIUM MEMBERSHIP

━━━━━━━━━━━━━━━━━━

Starter Plan
• 3 Days Access
• ₹99

Basic Plan
• 7 Days Access
• ₹199

Advanced Plan
• 15 Days Access
• ₹349

Professional Plan
• 30 Days Access
• ₹599

Enterprise Plan
• 3 Months Access
• ₹999

Ultimate Plan
• 6 Months Access
• ₹1799

Lifetime Plan
• Permanent Access
• ₹3000`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Make Payment",
callback_data: "make_payment"
}
]
]
}
}
)

})

/* PAYMENT SCREENSHOT */

bot.on("photo", async (msg) => {

await bot.sendPhoto(
OWNER_ID,
msg.photo[msg.photo.length - 1].file_id,
{
caption:
`NEW PAYMENT REQUEST

━━━━━━━━━━━━━━━━━━

User ID:
${msg.from.id}

Username:
@${msg.from.username || "No Username"}

Name:
${msg.from.first_name}`,
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
`PAYMENT SCREENSHOT SUBMITTED

Please Wait For Verification.`
)

})

/* ADD */

bot.onText(/\/add (.+)/, async (msg, match) => {

let username = match[1]
.replace("@","")
.trim()
.toLowerCase()

/* PREMIUM USER */

if(isPremium(msg.from.id)){

if(monitor.includes(username)){

return bot.sendMessage(
msg.chat.id,
`USERNAME ALREADY EXISTS

@${username} Is Already Under Monitoring.`
)

}

monitor.push(username)

saveData()

return bot.sendMessage(
msg.chat.id,
`PREMIUM MONITORING ACTIVATED

━━━━━━━━━━━━━━━━━━

Username:
@${username}

Plan:
Premium Unlimited

Status:
Monitoring Enabled`
)

}

/* FREE USER */

if(!freeUsers[msg.from.id]){

freeUsers[msg.from.id] = []

}

if(freeUsers[msg.from.id].length >= 1){

return bot.sendMessage(
msg.chat.id,
`FREE PLAN LIMIT REACHED

━━━━━━━━━━━━━━━━━━

Free Users Can Monitor
Only 1 Username.

Premium Users Get:
• Unlimited Monitoring
• Faster Alerts
• Premium Features

Use:
/plan`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Upgrade Premium",
callback_data: "make_payment"
}
]
]
}
}
)

}

if(monitor.includes(username)){

return bot.sendMessage(
msg.chat.id,
`USERNAME ALREADY EXISTS

@${username} Is Already Under Monitoring.`
)

}

monitor.push(username)

freeUsers[msg.from.id].push(username)

saveData()

bot.sendMessage(
msg.chat.id,
`FREE MONITORING ACTIVATED

━━━━━━━━━━━━━━━━━━

Username:
@${username}

Plan:
Free Plan

Limit:
1 Username Only`
)

})

/* WHO */

bot.onText(/\/who/, async (msg) => {

if(String(msg.from.id) != OWNER_ID) return

if(monitor.length == 0){

return bot.sendMessage(
msg.chat.id,
"No Usernames In Monitoring."
)

}

let text = "MONITORING LIST\n\n"

monitor.forEach((u,i)=>{

text += `${i+1}. @${u}\n`

})

bot.sendMessage(msg.chat.id,text)

})

/* LIST */

bot.onText(/\/list/, async (msg) => {

if(String(msg.from.id) != OWNER_ID) return

if(owned.length == 0){

return bot.sendMessage(
msg.chat.id,
"No Claimed Usernames."
)

}

let text = "CLAIMED USERNAMES\n\n"

owned.forEach((u,i)=>{

text += `${i+1}. @${u}\n`

})

bot.sendMessage(msg.chat.id,text)

})

/* TRANSFER */

bot.onText(/\/transfer (.+)/, async (msg, match) => {

if(!isPremium(msg.from.id)){

return bot.sendMessage(
msg.chat.id,
`PREMIUM REQUIRED

Username Transfer Is Available
Only For Premium Users.`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "Upgrade Premium",
callback_data: "make_payment"
}
]
]
}
}
)

}

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
"SELECT USERNAME",
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
`COMMAND PANEL

━━━━━━━━━━━━━━━━━━

USER COMMANDS

/start
Start Bot

/free
View Free Plan

/plan
View Premium Plans

/add username
Start Monitoring

/transfer
Transfer Username

/help
Open Command List

━━━━━━━━━━━━━━━━━━

ADMIN COMMANDS

/add username
Add Username

/who
Monitoring List

/list
Claimed Usernames

━━━━━━━━━━━━━━━━━━

SYSTEM STATUS

• Monitoring Online
• Database Connected
• Premium System Active`
)

})

/* USERNAME CHECKER */

setInterval(async () => {

for(let username of monitor){

try{

await bot.getChat("@" + username)

}catch(err){

if(
err.response &&
err.response.body.description
.includes("chat not found")
){

if(!owned.includes(username)){

owned.push(username)

saveData()

bot.sendMessage(
OWNER_ID,
`USERNAME AVAILABLE

━━━━━━━━━━━━━━━━━━

@${username}

Status:
Available To Claim`
)

}

}

}

}

},5000)

/* ERROR HANDLER */

bot.on("polling_error", console.log)

process.on("unhandledRejection", (err) => {
console.log(err)
})

process.on("uncaughtException", (err) => {
console.log(err)
})

console.log("BOT STARTED")
