import os
import asyncio
import logging
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

API_ID = 33039308
API_HASH = "2f74d55adead0491113d5871e2c8cb89"

# Channel redirect link
REDIRECT_URL = "https://t.me/bsr_shoppie"

# Global Pyrogram Client Object Instance
user_client = None

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

async def create_telegram_group(group_title: str, bot, owner_user_id: int) -> str:
    global user_client
    if not user_client or not user_client.is_connected:
        logger.error("Pyrogram Userbot Client is not running!")
        return None

    try:
        bot_info = await bot.get_me()
        bot_username = bot_info.username

        # 1. Create the Group via Userbot
        created_chat = await user_client.create_supergroup(title=group_title)
        chat_id = created_chat.id
        await asyncio.sleep(1)

        # 2. Add Assistant Bot to the Group
        await user_client.add_chat_members(chat_id, bot_username)
        await asyncio.sleep(1)

        # 3. Promote Assistant Bot with Admin Permissions and Anonymous Right
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
                is_anonymous=True  # Taaki message channel identity (group name) se jaye
            )
        )
        await asyncio.sleep(1)

        # 4. Set custom title badge to Main Bot as "Escrow Bot"
        await user_client.set_administrator_title(chat_id, bot_username, "Escrow Bot")
        await asyncio.sleep(1)

        # 5. Generate Group Invitation Link
        invite_link_obj = await user_client.create_chat_invite_link(chat_id)
        invite_link = invite_link_obj.invite_link

        # 6. Main Bot sends the welcome message anonymously
        welcome_msg_text = (
            "📍 **Hey there traders! Welcome to our escrow service.**\n\n"
            "✅ Please start with /dd command and fill the DealInfo Form"
        )
        
        sent_msg = await bot.send_message(
            chat_id=chat_id,
            text=welcome_msg_text,
            parse_mode="Markdown"
        )
        await bot.pin_chat_message(chat_id=chat_id, message_id=sent_msg.message_id)
        await asyncio.sleep(1)

        # 7. Bot sends the link directly to Owner ID personal chat (DM)
        try:
            notification_text = (
                "📦 <b>New Escrow Group Created Successfully!</b>\n\n"
                f"📂 <b>Group Title:</b> {group_title}\n"
                f"🔗 <b>Group Link:</b> {invite_link}\n\n"
                "ℹ️ <i>Userbot has safely left the group. Pinned setup is ready.</i>"
            )
            await bot.send_message(chat_id=owner_user_id, text=notification_text, parse_mode="HTML")
        except Exception as log_err:
            logger.error(f"Could not send link log to owner PM: {log_err}")

        # 8. Userbot (Creator) leaves the group completely
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
    
    # 🚀 YAHAN BADLAAV KIYA HAI: Username ki jagah ab Nickname (First Name + Last Name) aayega
    creator_nickname = user.first_name
    if user.last_name:
        creator_nickname += f" {user.last_name}"

    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title, context.bot, owner_user_id)
    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        live_link = await create_telegram_group(group_title, context.bot, owner_user_id)
    else:
        return

    if not live_link:
        await query.edit_message_text(
            text="❌ <b>Group create nahi hua, please dobara try karo.</b>",
            parse_mode="HTML"
            )
    
