import { NextResponse } from 'next/server'

// Setup: create a Telegram bot via @BotFather, then add to .env.local:
// TELEGRAM_BOT_TOKEN=your_bot_token
// TELEGRAM_CHAT_ID=your_chat_id  (get this by messaging your bot and calling /getUpdates)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, agency, message } = body

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (BOT_TOKEN && CHAT_ID) {
      const text = [
        `🔔 *New Access Request — ApplyPilot*`,
        ``,
        `👤 *Name:* ${name}`,
        email ? `📧 *Email:* ${email}` : null,
        phone ? `📱 *Phone/Telegram:* ${phone}` : null,
        `🏢 *Agency:* ${agency}`,
        message ? `💬 *Message:* ${message}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Telegram API error:', err)
      }
    } else {
      // Fallback: log to server console if env vars not set
      console.log('[ApplyPilot Contact Form] New submission:', { name, email, phone, agency, message })
      console.log('To activate Telegram notifications, add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env.local')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
