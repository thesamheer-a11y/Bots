import os
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Railway ke environment variable se token uthayega
BOT_TOKEN = os.environ.get("BOT_TOKEN")

# Aapka main redirect link
REDIRECT_URL = "https://t.me/PagalEscrowBot"

# --- 1. START COMMAND ---
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
    await update.message.reply_text(
        text=welcome_text, reply_markup=reply_markup, parse_mode="Markdown", disable_web_page_preview=True
    )

# --- 2. ESCROW COMMAND (Dono Photo 1 ke jaisa select options dikhayega) ---
async def escrow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = "Please select your escrow type from below."
    
    # Ye buttons callback_data bhejenge backend me bina redirect kiye, taaki process aage badhe
    keyboard = [
        [
            InlineKeyboardButton("P2P", callback_data="type_p2p"),
            InlineKeyboardButton("Product Deal", callback_data="type_product")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text=text, reply_markup=reply_markup)

# --- 3. BUTTON CLICK HANDLER (Photo 2 ke jaisa link aur creator name banyega) ---
async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer() # Button click accept karne ke liye
    
    # User ka naam nikalne ke liye (First name agar username na ho toh)
    user = query.from_user
    creator_name = f"@{user.username}" if user.username else user.first_name
    
    # Dummy Group Links (Asli bot me aap yahan apna dynamic link generator code laga sakte hain)
    p2p_link = "https://t.me/+Xcz5bgWzK70wMjc1"
    product_link = "https://t.me/+Q-8DJ8K6BWszODZk"
    
    if query.data == "type_p2p":
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
        # Niche ek 'VIEW GROUP' button jo group link par le jayega
        keyboard = [[InlineKeyboardButton("VIEW GROUP 👥", url=p2p_link)]]
        
    elif query.data == "type_product":
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

    await query.message.reply_text(
        text=msg_text, 
        reply_markup=InlineKeyboardMarkup(keyboard), 
        parse_mode="HTML",
        disable_web_page_preview=False # Isko False rakha hai taaki link ka preview box (Photo 2 jaisa) dikhe
    )

def main():
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN nahi mila!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CallbackQueryHandler(button_click)) # Buttons click handle karne ke liye
    
    application.run_polling()

if __name__ == "__main__":
    main()
    
