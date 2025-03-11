import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    if (body.message && body.message.text.startsWith("/start")) {
      console.log("Received /start command");
      const chatId = body.message.chat.id;

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Welcome! Click the button below to launch the Mini App.",
          reply_markup: {
            inline_keyboard: [[
              { text: "🚀 Open Mini App", web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "https://volleyball-rating.vercel.app" } }
            ]]
          }
        })
      });

      return NextResponse.json({ message: "WebApp button sent" });
    }

    console.log("Received inline query");
    // If an inline query is received
    if (body.inline_query) {
      const queryId = body.inline_query.id;
      
      const results = [
        {
          type: "article",
          id: new Date().getTime().toString(),
          title: "Launch Mini App",
          input_message_content: { message_text: "Click the button below to launch the Mini App!" },
          reply_markup: {
            inline_keyboard: [[
              { text: "🔵 Open Mini App", url: "https://t.me/volleyball_rating_bot?start=miniapp" }
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
      
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// This prevents requests with methods other than POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}