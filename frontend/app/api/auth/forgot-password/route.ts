/**
 * POST /api/auth/forgot-password
 *
 * 1. Verifies the email exists in our system.
 * 2. Generates a Supabase password-reset link.
 * 3. Sends a branded email from nasux1222@gmail.com.
 * 4. If the user has a Telegram chat ID linked, ALSO sends the reset link via Telegram.
 *
 * The link expires after one use (Supabase one-time token).
 *
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMail, resetPasswordEmailHtml } from '@/lib/mailer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// ── Telegram helper ──────────────────────────────────────────────────────────

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
  } catch (err) {
    console.error('[forgot-password] Telegram send failed:', err)
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Use the service key to query the DB and generate the admin reset link
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    )

    // Look up the user — include telegram_chat_id so we can notify via Telegram too
    const { data: existingUser } = await db
      .from('users')
      .select('id, telegram_chat_id')
      .eq('email', normalizedEmail)
      .single()

    if (!existingUser) {
      // Silently succeed — don't reveal whether the email is registered (security best practice)
      return NextResponse.json({ ok: true })
    }

    // Generate a one-time recovery link (Python SDK style: redirect_to is top-level)
    const { data: linkData, error: linkError } = await (db.auth.admin as any).generateLink({
      type: 'recovery',
      email: normalizedEmail,
      redirect_to: `${SITE_URL}/reset-password`,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[forgot-password] generateLink error:', linkError)
      return NextResponse.json({ error: 'Failed to generate reset link.' }, { status: 500 })
    }

    // Build a direct deep-link using hashed_token instead of action_link.
    // action_link goes through Supabase's verify server and delivers the session
    // via the URL hash (#access_token=…), which the @supabase/ssr browser client
    // doesn't reliably detect before verifyOtp runs — causing "Link expired or
    // invalid". The hashed_token URL lands the user directly on /reset-password
    // with ?token_hash=…&type=recovery, which verifyOtp handles correctly.
    const resetLink = `${SITE_URL}/reset-password?token_hash=${linkData.properties.hashed_token}&type=recovery`

    // ── 1. Send email ─────────────────────────────────────────────────────────
    const html = resetPasswordEmailHtml(normalizedEmail, resetLink)
    const emailSent = await sendMail({
      to: normalizedEmail,
      subject: 'Reset your ApplyPilot password',
      html,
      text: [
        `Hi,`,
        ``,
        `We received a password reset request for your ApplyPilot account.`,
        ``,
        `Click the link below to create a new password (expires in 1 hour, one-time use):`,
        ``,
        resetLink,
        ``,
        `If you didn't request this, you can safely ignore this email.`,
        ``,
        `— ApplyPilot Team`,
      ].join('\n'),
    })

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // ── 2. Send Telegram message (if the user has linked their Telegram) ──────
    const telegramChatId: string | null = existingUser.telegram_chat_id || null
    let telegramSent = false

    if (telegramChatId) {
      const telegramText = [
        `🔐 *ApplyPilot — Password Reset*`,
        ``,
        `Someone (hopefully you!) requested a password reset for your account.`,
        ``,
        `Tap the link below to set a new password — valid for *1 hour*, one-time use only:`,
        ``,
        resetLink,
        ``,
        `If you didn't request this, you can safely ignore this message.`,
      ].join('\n')

      await sendTelegramMessage(telegramChatId, telegramText)
      telegramSent = true
    }

    return NextResponse.json({ ok: true, telegram_sent: telegramSent })
  } catch (err) {
    console.error('[forgot-password] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
