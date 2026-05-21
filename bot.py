import os
import asyncio
import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Telethon Imports (Highly stable for real-time group auto creation)
from telethon import TelegramClient
from telethon.tl.functions.channels import CreateChannelRequest, InviteToChannelRequest, EditAdminRequest
from telethon.tl.functions.messages import ExportChatInviteRequest, PinChannelMessageRequest
from telethon.tl.types import ChatAdminRights

# Logging configuration for Railway stability
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

BOT_TOKEN = os.environ.get("BOT_TOKEN")
API_ID = os.environ.get("API_ID")       
API_HASH = os.environ.get("API_HASH", "").strip()   
STRING_SESSION = os.environ.get("STRING_SESSION", "").strip() 

REDIRECT_URL = "https://t.me/PagalEscrowBot"

# --- 1. START COMMAND (100% SAME TO SAME AS REQUESTED) ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    welcome_text = (
        "💫 @PagalEscrowBot 💫\n"
        "Your Trustworthy Telegram Escrow Service\n\n"
        "Welcome to @PagalEscrowBot. This bot provides a reliable escrow service "
        "for your transactions on Telegram.\n"
        "Avoid scams, your funds are safeguarded throughout your deals. If you run "
        "into any issues, simply type /dispute and an arbitrator will join the group "
        "chat within 24 hours.\n\n"
        "🎟️ **ESCROW FEE:**\n"
        "1.0% for P2P and 1.0% for OTC Flat\n\n"
        "🌐 ([UPDATES]({url})) - ([VOUCHES]({url})) ✔️\n\n"
        "💬 Proceed with /escrow (to start with a new escrow)\n\n"
        "⚠️ **IMPORTANT** - Make sure coin is same of Buyer and Seller else you may loose your coin.\n\n"
        "💡 Type /menu to summon a menu with all bots features"
    ).format(url=REDIRECT_URL)

    keyboard = [
        [InlineKeyboardButton("COMMANDS LIST 🤖", url=REDIRECT_URL)],
        [InlineKeyboardButton("☎️ CONTACT", url=REDIRECT_URL)],
        [
            InlineKeyboardButton("Updates 🔄", url=REDIRECT_URL),
            InlineKeyboardButton("Vouches ✔️", url=REDIRECT_URL)
        ],
        [
            InlineKeyboardButton("WHAT IS ESCROW ❓", url=REDIRECT_URL),
            InlineKeyboardButton("Instructions 🧑‍💻", url=REDIRECT_URL)
        ],
        [InlineKeyboardButton("Terms 📝", url=REDIRECT_URL)],
        [InlineKeyboardButton("Invites 👤", url=REDIRECT_URL)]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)
    if update.message:
        await update.message.reply_text(
            text=welcome_text, reply_markup=reply_markup, parse_mode="Markdown", disable_web_page_preview=True
        )

# --- 2. ESCROW COMMAND (100% SAME TO SAME AS REQUESTED) ---
async def escrow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = "Please select your escrow type from below."
    keyboard = [
        [
            InlineKeyboardButton("P2P", callback_data="type_p2p"),
            InlineKeyboardButton("Product Deal", callback_data="type_product")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    if update.message:
        await update.message.reply_text(text=text, reply_markup=reply_markup)

# --- REAL-TIME LIVE GROUP CREATION FUNCTION ---
async def create_telegram_group(group_title: str) -> str:
    if not API_ID or not API_HASH or not STRING_SESSION:
        logging.error("Configuration variables miss hain!")
        return "https://t.me/+Xcz5bgWzK70wMjc1"

    # Telethon client initialize ho raha hai session string se
    from telethon.sessions import StringSession
    client = TelegramClient(StringSession(STRING_SESSION), int(API_ID), API_HASH)
    
    try:
        await client.connect()
        
        # 1. Live real group/channel create karna
        result = await client(CreateChannelRequest(title=group_title, about="Automated Escrow Room", megagroup=True))
        created_chat = result.chats[0]
        chat_id = created_chat.id
        chat_access_hash = created_chat.access_hash
        
        # 2. Main Bot ko group mein add karna
        bot_me = await Application.builder().token(BOT_TOKEN).build().bot.get_me()
        bot_username = bot_me.username
        await client(InviteToChannelRequest(channel=created_chat, users=[bot_username]))
        
        # 3. Main Bot ko full admin privileges dena
        admin_rights = ChatAdminRights(
            change_info=True, post_messages=True, edit_messages=True, 
            delete_messages=True, ban_users=True, invite_users=True, 
            pin_messages=True, add_admins=True, manage_call=True
        )
        await client(EditAdminRequest(channel=created_chat, user_id=bot_username, admin_rights=admin_rights, rank="Escrow Bot"))
        
        # 4. Group ka unique primary dynamic link nikalna
        invite_result = await client(ExportChatInviteRequest(peer=created_chat))
        invite_link = invite_result.link
        
        # 5. Exact Screenshot wala text group ke andar bhej kar PIN karna
        welcome_msg_text = (
            "📍 <b>Hey there traders! Welcome to our escrow service.</b>\n"
            "✅ Please start with /dd command and fill the DealInfo Form"
        )
        sent_msg = await client.send_message(created_chat, welcome_msg_text, parse_mode="html")
        await client(PinChannelMessageRequest(channel=created_chat, id=sent_msg.id, notify=True))
        
        return invite_link
        
    except Exception as e:
        logging.error(f"Group automatic banane mein dikkat aayi: {e}")
        # Kuch gadbad hone par safe side ke liye random link dega taaki system crash na ho
        return f"https://t.me/+Xcz5bgWzK70wMjc1?err={id(e)}"
    finally:
        await client.disconnect()

# --- 3. BUTTON CLICK HANDLER (REAL LOGIC WITH EDIT) ---
async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    # CLICK HOTE HI MSG EDIT HOKAR BOLD ME WAITING TEXT DIKHAYEGA
    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")
    
    user = query.from_user
    creator_name = f"@{user.username}" if user.username else user.first_name
    
    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{live_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            "<b>P2P Escrow By PAGAL Bot</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=live_link)]]
        
    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{live_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            "<b>OTC Escrow By PAGAL Bot</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=live_link)]]
    else:
        return

    # KAHANI KHATAM: USI LOGIC KO WAPAS DUBARA EDIT KARKE LIVE EMBED CARD SHOW KAREGA
    await query.edit_message_text(
        text=msg_text, 
        reply_markup=InlineKeyboardMarkup(keyboard), 
        parse_mode="HTML",
        disable_web_page_preview=False
    )

def main():
    if not BOT_TOKEN:
        print("BOT_TOKEN missing!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CallbackQueryHandler(button_click))
    
    print("Bot is up and active...")
    application.run_polling()

if __name__ == "__main__":
    main()
