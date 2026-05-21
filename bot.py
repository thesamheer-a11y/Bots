import os
import asyncio
import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from pyrogram import Client

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

BOT_TOKEN = os.environ.get("BOT_TOKEN")
STRING_SESSION = os.environ.get("STRING_SESSION", "").strip()

API_ID = 33039308
API_HASH = "2f74d55adead0491113d5871e2c8cb89"

REDIRECT_URL = "https://t.me/PagalEscrowBot"

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

async def create_telegram_group(group_title: str, fallback_link: str, bot) -> str:
    if not STRING_SESSION:
        logging.warning("STRING_SESSION missing!")
        return fallback_link

    try:
        user_client = Client(
            "escrow_userbot",
            api_id=API_ID,
            api_hash=API_HASH,
            session_string=STRING_SESSION,
            in_memory=True
        )
        await user_client.start()

        bot_info = await bot.get_me()
        bot_username = bot_info.username

        created_chat = await user_client.create_supergroup(title=group_title)
        chat_id = created_chat.id

        await user_client.add_chat_members(chat_id, bot_username)
        await user_client.promote_chat_member(chat_id=chat_id, user_id=bot_username)

        invite_link_obj = await user_client.export_chat_invite_link(chat_id)
        invite_link = invite_link_obj.invite_link if hasattr(invite_link_obj, 'invite_link') else str(invite_link_obj)

        welcome_msg_text = (
            "📍 <b>Hey there traders! Welcome to our escrow service.</b>\n\n"
            "✅ Please start with /dd command and fill the DealInfo Form\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "🔒 <b>Rules:</b>\n"
            "1️⃣ <b>Buyer</b> sends funds to escrow first\n"
            "2️⃣ <b>Seller</b> delivers the product/service\n"
            "3️⃣ <b>Buyer</b> confirms receipt\n"
            "4️⃣ Escrow releases funds to <b>Seller</b>\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "⚠️ <b>For disputes type /dispute</b>"
        )
        sent_msg = await user_client.send_message(chat_id, welcome_msg_text, parse_mode="html")
        await user_client.pin_chat_message(chat_id, sent_msg.id)

        return invite_link
    except Exception as e:
        logging.error(f"Error: {e}")
        return fallback_link
    finally:
        try:
            await user_client.stop()
        except:
            pass

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")

    user = query.from_user
    creator_name = f"@{user.username}" if user.username else user.first_name

    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        default_p2p = "https://t.me/+Xcz5bgWzK70wMjc1"
        live_link = await create_telegram_group(group_title, default_p2p, context.bot)

        msg_text = (
            "<u><b>Escrow Group Created ✅</b></u>\n\n"
            f"👤 <b>Creator:</b> {creator_name}\n\n"
            "<b>Join this escrow group and share the link with the buyer and seller.</b>\n\n"
            f"🔗 {live_link}\n\n"
            "┌─────────────────────\n"
            "│ 🔸 <b>Telegram</b>\n"
            "│ <b>P2P Escrow By PAGAL Bot</b>\n"
            "│ You've been invited to join\n"
            "│ this group on Telegram.\n"
            "└─────────────────────\n\n"
            "⚠️ <b>Note: This link is for 2 members only—third parties are not allowed to join.</b>"
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=live_link)]]

    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        default_product = "https://t.me/+Q-8DJ8K6BWszODZk"
        live_link = await create_telegram_group(group_title, default_product, context.bot)

        msg_text = (
            "<u><b>Escrow Group Created ✅</b></u>\n\n"
            f"👤 <b>Creator:</b> {creator_name}\n\n"
            "<b>Join this escrow group and share the link with the buyer and seller.</b>\n\n"
            f"🔗 {live_link}\n\n"
            "┌─────────────────────\n"
            "│ 🔸 <b>Telegram</b>\n"
            "│ <b>OTC Escrow By PAGAL Bot</b>\n"
            "│ You've been invited to join\n"
            "│ this group on Telegram.\n"
            "└─────────────────────\n\n"
            "⚠️ <b>Note: This link is for 2 members only—third parties are not allowed to join.</b>"
        )
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=live_link)]]
    else:
        return

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

    print("Bot is running...")
    application.run_polling()

if __name__ == "__main__":
    main()
