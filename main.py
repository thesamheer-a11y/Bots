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

# ⚠️ YAHAN DIRECT APNA NEW DUMMY BOT TOKEN PASTE KARO (Quotes ke andar)
DUMMY_BOT_TOKEN = "YAHAN_APNA_NEW_BOT_TOKEN_DALO"

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

async def create_telegram_group(group_title: str, bot, owner_user_id: int, creator_nickname: str) -> str:
    global user_client
    if not user_client or not user_client.is_connected:
        logger.error("Pyrogram Userbot Client is not running!")
        return None

    dummy_bot_client = Client("dummy_bot_session", api_id=API_ID, api_hash=API_HASH, bot_token=DUMMY_BOT_TOKEN, in_memory=True)

    try:
        bot_info = await bot.get_me()
        bot_username = bot_info.username

        await dummy_bot_client.start()
        dummy_info = await dummy_bot_client.get_me()
        dummy_username = dummy_info.username

        # 1. Owner (Userbot) creates the group
        created_chat = await user_client.create_supergroup(title=group_title)
        chat_id = created_chat.id
        await asyncio.sleep(1)

        # 2. Owner adds Main Assistant Bot to the group
        await user_client.add_chat_members(chat_id, bot_username)
        await asyncio.sleep(1)

        # 3. Owner promotes Main Assistant Bot to Full Admin
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

        # 4. Owner adds Dummy Bot to the group
        await user_client.add_chat_members(chat_id, dummy_username)
        await asyncio.sleep(1)

        # 5. Owner promotes Dummy Bot with Custom Title & Anonymous rights
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

        # 6. Generate Group Invitation Link
        invite_link_obj = await user_client.create_chat_invite_link(chat_id)
        invite_link = invite_link_obj.invite_link

        # 7. Dummy Bot sends the welcome message anonymously
        welcome_msg_text = (
            "📍 **Hey there traders! Welcome to our escrow service.**\n\n"
            "✅ Please start with /dd command and fill the DealInfo Form"
        )
        
        sent_msg = await dummy_bot_client.send_message(
            chat_id=chat_id,
            text=welcome_msg_text,
            parse_mode=enums.ParseMode.MARKDOWN
        )
        await dummy_bot_client.pin_chat_message(chat_id=chat_id, message_id=sent_msg.id)
        await asyncio.sleep(1)

        # 8. Main Assistant Bot demotes and kicks the Dummy Bot out safely
        await bot.ban_chat_member(chat_id=chat_id, user_id=dummy_info.id)
        await bot.unban_chat_member(chat_id=chat_id, user_id=dummy_info.id)
        await asyncio.sleep(1)

        # 9. Dummy Bot directly sends the link to Owner's personal chat (DM)
        try:
            notification_text = (
                "📦 <b>New Escrow Group Created Successfully!</b>\n\n"
                f"📂 <b>Group Title:</b> {group_title}\n"
                f"🔗 <b>Group Link:</b> {invite_link}\n\n"
                f"👤 <b>Creator Nickname:</b> {creator_nickname}\n\n"
                "ℹ_Userbot has safely left the group. Anonymous setup complete._"
            )
            await dummy_bot_client.send_message(chat_id=owner_user_id, text=notification_text, parse_mode="HTML")
        except Exception as log_err:
            logger.error(f"Dummy Bot failed to send link to owner PM: {log_err}")

        # 10. Owner (Userbot) leaves the group completely
        await user_client.leave_chat(chat_id)

        return invite_link

    except Exception as e:
        logger.error(f"Group creation routine failed: {e}", exc_info=True)
        return None
    finally:
        if dummy_bot_client.is_connected:
            await dummy_bot_client.stop()

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")

    user = query.from_user
    owner_user_id = user.id
    
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

    # Initialize PTB Application 
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CallbackQueryHandler(button_click))
    
    application.add_handler(MessageHandler(
        filters.StatusUpdate.NEW_CHAT_MEMBERS | 
        filters.StatusUpdate.LEFT_CHAT_MEMBER | 
        filters.StatusUpdate.CHAT_CREATED, 
        auto_delete_service_messages
    ))

    async with application:
        await application.initialize()
        await application.start()
        logger.info("Telegram Bot API Framework active and polling...")
        await application.updater.start_polling()
        
        try:
            while True:
                await asyncio.sleep(3600)
        except (KeyboardInterrupt, asyncio.CancelledError):
            logger.info("Shutdown signal caught...")
        finally:
            logger.info("Stopping components...")
            await application.updater.stop()
            await application.stop()
            await user_client.stop()

def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
        
