import os
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, ContextTypes

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

# --- 2. ESCROW COMMAND ---
async def escrow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    escrow_text = (
        "🤝 **NEW ESCROW TRANSACTION** 🤝\n\n"
        "Nayi deal shuru karne ke liye niche diye gaye format ko fill karein:\n\n"
        "🔹 **Buyer:** @username\n"
        "🔹 **Seller:** @username\n"
        "🔹 **Amount/Coin:** 100 USDT\n"
        "🔹 **Deal Rules:** [Yahan details likhein]\n\n"
        "Dono parties jab agree kareingi, tabhi funds escrow wallet me safe rakhe jayenge."
    )
    # Iske niche bhi redirect button de diya taaki click karte hi bot khule
    keyboard = [[InlineKeyboardButton("Start Deal Process 🚀", url=REDIRECT_URL)]]
    await update.message.reply_text(text=escrow_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

# --- 3. DISPUTE COMMAND ---
async def dispute(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    dispute_text = (
        "⚠️ **DISPUTE RAISED** ⚠️\n\n"
        "Aapki deal me koi issue aaya hai? Pareshan mat hoiye.\n"
        "Humare **Official Arbitrators** ko notify kar diya gaya hai. Agle 24 gante ke andar ek admin is group chat me aakar aapka mamla solve karega.\n\n"
        "Tab tak kripya deal ke proofs (screenshots/chats) taiyar rakhein."
    )
    keyboard = [[InlineKeyboardButton("Contact Support Head 🧑‍⚖️", url=REDIRECT_URL)]]
    await update.message.reply_text(text=dispute_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

# --- 4. RELEASE COMMAND ---
async def release(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    release_text = (
        "✅ **FUNDS RELEASE REQUEST** ✅\n\n"
        "Agar aapko aapka product/service sahi salamat mil gayi hai, toh aap funds release kar sakte hain.\n\n"
        "⚠️ **Note:** Ek baar funds release hone ke baad unhe wapas nahi laya ja sakta."
    )
    keyboard = [[InlineKeyboardButton("Confirm & Release Crypto 🔓", url=REDIRECT_URL)]]
    await update.message.reply_text(text=release_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

# --- 5. CANCEL COMMAND ---
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    cancel_text = (
        "❌ **CANCEL TRANSACTION** ❌\n\n"
        "Kya aap is deal ko cancel karna chahte hain? Deal cancel karne ke liye dono (Buyer aur Seller) ki manzoori zaroori hai."
    )
    keyboard = [[InlineKeyboardButton("Request Cancel 🚫", url=REDIRECT_URL)]]
    await update.message.reply_text(text=cancel_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

# --- 6. MENU COMMAND ---
async def menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    menu_text = (
        "🛠️ **PAGAL ESCROW BOT MENU** 🛠️\n\n"
        "Aap niche di gayi commands ka use kar sakte hain:\n"
        "➡️ `/start` - Main Menu dekhne ke liye\n"
        "➡️ `/escrow` - Nayi deal shuru karne ke liye\n"
        "➡️ `/release` - Buyer dwara paise seller ko bhejne ke liye\n"
        "➡️ `/dispute` - Jhagda hone par admin bulane ke liye\n"
        "➡️ `/cancel` - Deal radd (cancel) karne ke liye"
    )
    keyboard = [[InlineKeyboardButton("Open Full Dashboard 📊", url=REDIRECT_URL)]]
    await update.message.reply_text(text=menu_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")


def main():
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN environment variable nahi mila!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Saari commands ke handlers yahan register kar diye hain
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("escrow", escrow))
    application.add_handler(CommandHandler("dispute", dispute))
    application.add_handler(CommandHandler("release", release))
    application.add_handler(CommandHandler("cancel", cancel))
    application.add_handler(CommandHandler("menu", menu))
    
    application.run_polling()

if __name__ == "__main__":
    main()
  
