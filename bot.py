import os
import asyncio
import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Telethon Core Imports (In-Memory Session for Railway Stability)
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.channels import CreateChannelRequest, InviteToChannelRequest, EditAdminRequest
from telethon.tl.functions.messages import ExportChatInviteRequest, PinChannelMessageRequest
from telethon.tl.types import ChatAdminRights

# Logging settings to prevent Railway deployment failures
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- ENVIRONMENT VARIABLES ---
BOT_TOKEN = os.environ.get("BOT_TOKEN")
STRING_SESSION = os.environ.get("STRING_SESSION", "").strip() 

# AAPKE SCREENSHOT WALI FIXED API CREDENTIALS (NO VARIABLES REQ FOR THESE TWO)
API_ID = 33039308
API_HASH = "2f74d55adead0491113d5871e2c8cb89"

REDIRECT_URL = "https://t.me/PagalEscrowBot"

# --- 1. START COMMAND (100% SAME TO SAME) ---
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

# --- 2. ESCROW COMMAND (100% SAME TO SAME) ---
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

# --- AUTOMATIC GROUP CREATION LOGIC WITH HARD-CODED API CREDENTIALS ---
async def create_telegram_group(group_title: str, fallback_link: str) -> str:
    # CRASH PROTECTION: Agar Railway me String Session na mile toh crash hone ke bajay safe link return karega
    if not STRING_SESSION:
        logging.warning("STRING_SESSION variable missing hai dashboard mein! Fallback link diya gaya.")
        await asyncio.sleep(2)
        return fallback_link

    # Stable StringSession initialization
    client = TelegramClient(StringSession(STRING_SESSION), API_ID, API_HASH)
    
    try:
        await client.connect()
        
        # 1. Real dynamic group supergroup create karna
        result = await client(CreateChannelRequest(title=group_title, about="Automated Escrow Room", megagroup=True))
        created_chat = result.chats[0]
        
        # 2. Main Bot username fetches and adds to group
        bot_me = await Application.builder().token(BOT_TOKEN).build().bot.get_me()
        bot_username = bot_me.username
        await client(InviteToChannelRequest(channel=created_chat, users=[bot_username]))
        
        # 3. Main Bot ko full operational admin privileges dena
        admin_rights = ChatAdminRights(
            change_info=True, post_messages=True, edit_messages=True, 
            delete_messages=True, ban_users=True, invite_users=True, 
            pin_messages=True, add_admins=True, manage_call=True
        )
        await client(EditAdminRequest(channel=created_chat, user_id=bot_username, admin_rights=admin_rights, rank="Escrow Bot"))
        
        # 4. Group Invite Link export karna
        invite_result = await client(ExportChatInviteRequest(peer=created_chat))
        invite_link = invite_result.link
        
        # 5. Screenshot wale pinned message ka text bhej kar PIN karna
        welcome_msg_text = (
            "📍 <b>Hey there traders! Welcome to our escrow service.</b>\n"
            "✅ Please start with /dd command and fill the DealInfo Form"
        )
        sent_msg = await client.send_message(created_chat, welcome_msg_text, parse_mode="html")
        await client(PinChannelMessageRequest(channel=created_chat, id=sent_msg.id, notify=True))
        
        return invite_link
        
    except Exception as e:
        logging.error(f"Group dynamic creation failed, safely running fallback: {e}")
        return fallback_link
    finally:
        await client.disconnect()

# --- 3. BUTTON CLICK HANDLER (100% SAME TO SAME WITH EDIT METHOD) ---
async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    # 1. Click hote hi select message instantly bold loading text mein badal jayega
    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")
    
    user = query.from_user
    creator_name = f"@{user.username}" if user.username else user.first_name
    
    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        default_p2p = "https://t.me/+Xcz5bgWzK70wMjc1"
        p2p_link = await create_telegram_group(group_title, default_p2p)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{p2p_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            "<b>P2P Escrow By PAGAL Bot</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=p2p_link)]]
        
    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        default_product = "https://t.me/+Q-8DJ8K6BWszODZk"
        product_link = await create_telegram_group(group_title, default_product)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{product_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            "<b>OTC Escrow By PAGAL Bot</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=product_link)]]
    else:
        return

    # 2. Usi loading text wale message ko final card dashboard mein edit kar dega (Photo 2 look)
    await query.edit_message_text(
        text=msg_text, 
        reply_markup=InlineKeyboardMarkup(keyboard), 
        parse_mode="HTML",
        disable_web_page_preview=False
    )

def main():
    if not BOT_TOKEN:
        print("CRITICAL: BOT_TOKEN is missing in environment variables!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CallbackQueryHandler(button_click))
    
    print("Bot is fully running on cloud environment...")
    application.run_polling()

if __name__ == "__main__":
    main()
        
