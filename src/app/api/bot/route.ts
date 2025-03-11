import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end(); // Only POST requests
  
    const body = req.body;
  
    // If an inline query is received
    if (body.inline_query) {
      const queryId = body.inline_query.id;
  
      const results = [
        {
          type: "article",
          id: "1",
          title: "Launch Mini App",
          input_message_content: { message_text: "Click the button below to launch the Mini App!" },
          reply_markup: {
            inline_keyboard: [[
              { text: "🔵 Open Mini App", web_app: { url: "https://your-app.vercel.app" } }
            ]]
          }
        }
      ];
  
      // Send inline response to Telegram API
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerInlineQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inline_query_id: queryId,
          results,
          cache_time: 0
        })
      });
  
      return res.status(200).end();
    }
  
    res.status(200).json({ message: "OK" });
  }