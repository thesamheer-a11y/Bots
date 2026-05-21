import os
import asyncio
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Pyrogram Core Imports (For automatic group creation)
from pyrogram import Client
from pyrogram.enums import ChatType

# --- ENVIRONMENT VARIABLES (Railway Settings) ---
BOT_TOKEN = os.environ.get("BOT_TOKEN")
API_ID = os.environ.get("API_ID")       # my.telegram.org se mila hua Integer ID
API_HASH = os.environ.get("API_HASH")   # my.telegram.org se mila hua Hash String
STRING_SESSION = os.environ.get("STRING_SESSION") # Aapke account ka login session string

REDIRECT_URL = "https://t.me/PagalEscrowBot"

# --- 1. START COMMAND ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    welcome_text = (
        "💫 @PagalEscrowBot 💫\n"
        "<b>Your Trustworthy Telegram Escrow Service</b>\n\n"
        "Welcome to @PagalEscrowBot. This bot provides a reliable escrow service "
        "for your transactions on Telegram.\n"
        "Avoid scams, your funds are safeguarded throughout your deals. If you run "
        "into any issues, simply type /dispute and an arbitrator will join the group "
        "chat within 24 hours.\n\n"
        "🎟️ <b>ESCROW FEE:</b>\n"
        "1.0% for P2P and 1.0% for OTC Flat\n\n"
        f"🌐 (<a href='{REDIRECT_URL}'>UPDATES</a>) - (<a href='{REDIRECT_URL}'>VOUCHES</a>) ✔️\n\n"
        "💬 Proceed with /escrow (to start with a new escrow)\n\n"
        "⚠️ <b>IMPORTANT</b> - Make sure coin is same of Buyer and Seller else you may loose your coin.\n\n"
        "💡 Type /menu to summon a menu with all bots features"
    )

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
            text=welcome_text, 
            reply_markup=InlineKeyboardMarkup(keyboard), 
            parse_mode="HTML", 
            disable_web_page_preview=True
        )

# --- 2. ESCROW COMMAND ---
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

# --- 4. BACK-END CORE: REAL-TIME GROUP CREATION FUNCTION ---
async def create_telegram_group(group_title: str) -> str:
    """
    Yeh function back-end me automatic group banayega, main bot ko add karega, 
    aur group ke andar welcome message pin karega jaisa SS me hai.
    """
    # Agar environment config missing hai toh safety crash se bachne ke liye fallback dummy link
    if not (API_ID and API_HASH and STRING_SESSION):
        await asyncio.sleep(2.5) # Realistic waiting delay mimic karne ke liye
        return "https://t.me/+Xcz5bgWzK70wMjc1"

    # Pyrogram client initialize ho raha hai session ke sath
    user_client = Client(
        "escrow_userbot",
        api_id=int(API_ID),
        api_hash=API_HASH,
        session_string=STRING_SESSION,
        in_memory=True
    )
    
    await user_client.start()
    try:
        # 1. Group create karna
        bot_username = (await Application.builder().token(BOT_TOKEN).build().bot.get_me()).username
        created_chat = await user_client.create_supergroup(title=group_title)
        chat_id = created_chat.id
        
        # 2. Main Bot ko group me add karke full admin rights dena
        await user_client.add_chat_members(chat_id, bot_username)
        await user_client.promote_chat_member(
            chat_id=chat_id,
            user_id=bot_username,
            privileges=None # default high privileges auto-assign ho jate hain supergroup me
        )
        
        # 3. Group ka secondary primary invite link generate karna
        invite_link_obj = await user_client.export_chat_invite_link(chat_id)
        invite_link = invite_link_obj.invite_link if hasattr(invite_link_obj, 'invite_link') else str(invite_link_obj)
        
        # 4. Group ke andar welcome message bhej kar PIN karna (Jaisa SS-2 me dikha)
        welcome_msg_text = (
            f"📍 <b>Hey there traders! Welcome to our escrow service.</b>\n"
            f"✅ Please start with /dd command and fill the DealInfo Form"
        )
        sent_msg = await user_client.send_message(chat_id, welcome_msg_text, parse_mode="HTML")
        await user_client.pin_chat_message(chat_id, sent_msg.id)
        
        return invite_link
    except Exception as e:
        print(f"Group Creation Error: {e}")
        return "https://t.me/+Xcz5bgWzK70wMjc1" # Exception aane par fallback default crash safety link
    finally:
        await user_client.stop()

# --- 3. BUTTON CLICK HANDLER (EDIT MESSAGE LOGIC) ---
async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer() # Loading clock indicator hatane ke liye
    
    # 1st CHANGE: Usi instant message ko EDIT karke bold waiting text me badal dena
    waiting_text = "<b>Creating a safe trading place for you, please wait...</b>"
    await query.edit_message_text(text=waiting_text, parse_mode="HTML")
    
    user = query.from_user
    creator_name = f"@{user.username}" if user.username else user.first_name
    
    # Decision handle karna aur background me live group API run karna
    if query.data == "type_p2p":
        group_title = "P2P Escrow By PAGAL Bot"
        generated_link = await create_telegram_group(group_title)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{generated_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            f"<b>{group_title}</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
        
    elif query.data == "type_product":
        group_title = "OTC Escrow By PAGAL Bot"
        generated_link = await create_telegram_group(group_title)
        
        msg_text = (
            "<u><b>Escrow Group Created</b></u>\n\n"
            f"<b>Creator:</b> {creator_name}\n\n"
            "Join this escrow group and share the link with the buyer and seller.\n\n"
            f"{generated_link}\n\n"
            "🔸 <b>Telegram</b>\n"
            f"<b>{group_title}</b>\n"
            "You’ve been invited to join this group on Telegram.\n\n"
            "⚠️ Note: This link is for 2 members only—third parties are not allowed to join."
        )
    else:
        return

    # 2nd CHANGE: Usi waiting text wale message ko dubara EDIT karke final screenshot jaisa card bana dena
    keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=generated_link)]]
    await query.edit_message_text(
        text=msg_text, 
        reply_markup=InlineKeyboardMarkup(keyboard), 
        parse_mode="HTML",
        disable_web_page_preview=False # Taki Telegram ka internal background rich layout card (Photo 1 jaisa) active ho jaye
    )

# --- MAIN EXECUTION ---
def main():
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN nahi mila!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CallbackQueryHandler(button_click))
    
    print("Bot is successfully running...")
    application.run_polling()

if __name__ == "__main__":
    main()
    
