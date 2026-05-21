import os
import asyncio
import logging
import urllib.request
import urllib.parse
import json
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from pyrogram import Client, enums
from pyrogram.types import ChatPrivileges

# Logging setup
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment Variables
BOT_TOKEN = os.environ.get("BOT_TOKEN")
STRING_SESSION = os.environ.get("STRING_SESSION", "").strip()
DUMMY_BOT_TOKEN = os.environ.get("DUMMY_BOT_TOKEN", "").strip()

API_ID = 33039308
API_HASH = "2f74d55adead0491113d5871e2c8cb89"

# Channel redirect link
REDIRECT_URL = "https://t.me/bsr_shoppie"

# Global Pyrogram Client Object Instance
user_client = None

# Pure Web-API helper method to handle Dummy Bot smoothly without Pyrogram crashes
def send_dummy_telegram_request(method: str, data: dict):
    try:
        url = f"https://api.telegram.org/bot{DUMMY_BOT_TOKEN}/{method}"
        req_data = urllib.parse.urlencode(data).encode('utf-8')
        req = urllib.request.Request(url, data=req_data)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        logger.error(f"HTTP request failed for dummy bot method {method}: {e}")
        return None

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
        [InlineKeyboardButton("Updates 🔄", url=REDIRECT_URL), InlineKeyboardButton("Vouches ✔️", url=REDIRECT_URL)],
        [InlineKeyboardButton("WHAT IS ESCROW ❓", url=REDIRECT_URL), InlineKeyboardButton("Instructions 🧑‍💻", url=REDIRECT_URL)],
        [InlineKeyboardButton("Terms 📝", url=REDIRECT_URL)],
        [InlineKeyboardButton("Invites 👤", url=REDIRECT_URL)]
    ]

    if update.message:
        await update.message.reply_text(
            text=welcome_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown", disable_web_page_preview=True
        )
        await update.message.reply_text(
            text="Please select your escrow type from below.",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("P2P", callback_data="type_p2p"),
                    InlineKeyboardButton("Product Deal", callback_data="type_product")
                ]
            ])
        )

async def escrow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = "Please select your escrow type from below."
    keyboard = [
        [
            InlineKeyboardButton("P2P", callback_data="type_p2p"),
            InlineKeyboardButton("Product Deal", callback_data="type_product")
        ]
    ]
    if update.message:
        await update.message.reply_text(text=text, reply_markup=InlineKeyboardMarkup(keyboard))

async def create_telegram_group(group_title: str, bot, owner_user_id: int, creator_nickname: str) -> str:
    global user_client
    if not user_client or not user_client.is_connected:
        logger.error("Pyrogram Userbot Client is not running!")
        return None

    try:
        bot_info = await bot.get_me()
        bot_username = bot_info.username

        # Safely fetch dummy bot metadata using API
        dummy_res = send_dummy_telegram_request("getMe", {})
        if not dummy_res or not dummy_res.get("ok"):
            logger.error("DUMMY_BOT_TOKEN is either wrong or empty!")
            return None
            
        dummy_id = dummy_res["result"]["id"]
        dummy_username = dummy_res["result"]["username"]

        # 1. Userbot (Owner) group create karega
        created_chat = await user_client.create_supergroup(title=group_title)
        chat_id = created_chat.id
        await asyncio.sleep(1)

        # 2. Main Assistant Bot ko add karega
        await user_client.add_chat_members(chat_id, bot_username)
        await asyncio.sleep(1)

        # 3. Main Assistant Bot ko Full Admin banayega
        await user_client.promote_chat_member(
            chat_id=chat_id,
            user_id=bot_username,
            privileges=ChatPrivileges(
                can_manage_chat=True,
                can_delete_messages=True,
                can_restrict_members=True,
                can_change_info=True,
                can_invite_users=True,
                can_pin_messages=True,
                can_manage_video_chats=False
            )
        )
        await asyncio.sleep(1)

        # 4. Dummy Bot ko group me add karega
        await user_client.add_chat_members(chat_id, dummy_username)
        await asyncio.sleep(1)

        # 5. Dummy Bot ko Admin banayega + Custom Tag "Escrow Bot" + Anonymous permission
        await user_client.promote_chat_member(
            chat_id=chat_id,
            user_id=dummy_username,
            privileges=ChatPrivileges(
                can_manage_chat=True,
                can_delete_messages=True,
                can_restrict_members=True,
                can_change_info=True,
                can_invite_users=True,
                can_pin_messages=True,
                is_anonymous=True
            )
        )
        await user_client.set_administrator_title(chat_id, dummy_username, "Escrow Bot")
        await asyncio.sleep(1)

        # 6. Group Invitation Link generate karega
        invite_link_obj = await user_client.create_chat_invite_link(chat_id)
        invite_link = invite_link_obj.invite_link

        # 7. Dummy Bot anonymous welcome msg bhejega
        welcome_msg_text = (
            "📍 **Hey there traders! Welcome to our escrow service.**\n\n"
            "✅ Please start with /dd command and fill the DealInfo Form"
        )
        
        send_msg_res = send_dummy_telegram_request("sendMessage", {
            "chat_id": chat_id,
            "text": welcome_msg_text,
            "parse_mode": "Markdown"
        })
        
        if send_msg_res and send_msg_res.get("ok"):
            msg_id = send_msg_res["result"]["message_id"]
            # Dummy Bot use pin karega
            send_dummy_telegram_request("pinChatMessage", {
                "chat_id": chat_id,
                "message_id": msg_id
            })
        await asyncio.sleep(1)

        # 8. Main Bot us Dummy Bot ko group se kick kar dega
        await bot.ban_chat_member(chat_id=chat_id, user_id=dummy_id)
        await bot.unban_chat_member(chat_id=chat_id, user_id=dummy_id)
        await asyncio.sleep(1)

        # 9. Dummy Bot Owner ko personal DM me group link aur nickname bhejega
        try:
            notification_text = (
                "📦 <b>New Escrow Group Created Successfully!</b>\n\n"
                f"📂 <b>Group Title:</b> {group_title}\n"
                f"🔗 <b>Group Link:</b> {invite_link}\n\n"
                f"👤 <b>Creator Nickname:</b> {creator_nickname}\n\n"
                "ℹ️ <i>Userbot has safely left the group. Anonymous setup complete.</i>"
            )
            send_dummy_telegram_request("sendMessage", {
                "chat_id": owner_user_id,
                "text": notification_text,
                "parse_mode": "HTML"
            })
        except Exception as log_err:
            logger.error(f"Dummy Bot failed to send log update: {log_err}")

        # 10. Userbot (Owner) khud group leave kar dega
        await user_client.leave_chat(chat_id)

        return invite_link

    except Exception as e:
        logger.error(f"Group creation routine failed: {e}", exc_info=True)
        return None

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")

    user = query.from_user
    owner_user_id = user.id
    
    # Nickname format (First name + Last name)
    creator_nickname = user.first_name
    if user.last_name:
        creator_nickname += f" {user.last_name}"

    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title, context.bot, owner_user_id, creator_nickname)
    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title, context.bot, owner_user_id, creator_nickname)
    else:
        return

    if not live_link:
        await query.edit_message_text(
            text="❌ <b>Group create nahi hua, please dobara try karo.</b>",
            parse_mode="HTML"
        )
        return

    msg_text = (
        "<u><b>Escrow Group Created</b></u>\n\n"
        f"<b>Creator: {creator_nickname}</b>\n\n"
        "<b>Join this escrow group and share the link with the buyer and seller.</b>\n\n"
        f"{live_link}\n\n"
        "<blockquote>⚠️ Note: This link is for 2 members only—third parties are not allowed to join.</blockquote>"
    )

    await query.edit_message_text(
        text=msg_text,
        parse_mode="HTML",
        disable_web_page_preview=False
    )

async def auto_delete_service_messages(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message:
        try:
            await update.message.delete()
        except Exception as e:
            logger.error(f"Failed to delete service message: {e}")

async def main_async():
    global user_client
    
    if not BOT_TOKEN or not STRING_SESSION or not DUMMY_BOT_TOKEN:
        logger.error("Missing critical environment variables (BOT_TOKEN, STRING_SESSION, or DUMMY_BOT_TOKEN)")
        return

    logger.info("Initializing Pyrogram Userbot Client...")
    user_client = Client(
        "escrow_userbot",
        api_id=API_ID,
        api_hash=API_HASH,
        session_string=STRING_SESSION,
        in_memory=True
    )
    
    await user_client.start()
    logger.info("Pyrogram Userbot Client started successfully.")

    # Initialize PT
    
