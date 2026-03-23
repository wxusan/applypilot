// Telegram Bot setup:
// 1. Message @BotFather on Telegram → /newbot → get BOT_TOKEN
// 2. Start a chat with your bot, then get your CHAT_ID from:
//    https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
// 3. Add to .env.local:
//    TELEGRAM_BOT_TOKEN=123456789:ABCdef...
//    TELEGRAM_CHAT_ID=1753566525

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, phone, agency, message } = body

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID

  if (BOT_TOKEN && CHAT_ID) {
    const text = `🔔 *New Access Request*\n\n👤 *Name:* ${name}\n📱 *Phone:* ${phone}\n🏢 *Agency:* ${agency}\n💬 *Message:* ${message || 'No message'}`

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    })
  } else {
    console.log('Telegram not configured. Form submission:', { name, phone, agency, message })
  }

  return NextResponse.json({ success: true })
}
