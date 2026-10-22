
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));

// Serve the website files
app.use(express.static(__dirname, { dotfiles: "ignore" }));

// Receive her message and send it to Telegram
app.post("/api/message", async (req, res) => {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message || message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "الرسالة لازم تكون من حرف إلى 2000 حرف.",
      });
    }

    const token = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!token || !chatId) {
      console.error("Telegram environment variables are missing.");

      return res.status(500).json({
        success: false,
        error: "الإرسال مش متاح حاليًا.",
      });
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `💌 رسالة جديدة من حكايتنا:\n\n${message}`,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error("Telegram delivery failed:", result.description);

      return res.status(502).json({
        success: false,
        error: "الإرسال فشل، جرّب مرة تانية.",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Message delivery error:", error.message);

    return res.status(500).json({
      success: false,
      error: "حصل خطأ أثناء الإرسال.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hekayetna server running on port ${PORT}`);
});
