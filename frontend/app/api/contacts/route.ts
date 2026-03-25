import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const SOURCE_LABELS: Record<string, string> = {
  waitlist: '🌐 Landing Page CTA',
  access_request: '📋 Access Request Form',
  student: '🎓 New Student Added',
  staff_invite: '👤 Staff Invited',
  agency_created: '🏢 Agency Created',
}

const ROLE_EMOJI: Record<string, string> = {
  prospect: '🔍',
  student: '🎓',
  staff: '👤',
  agency_owner: '🏢',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, source, role, note, agency_id } = body

    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 })
    }

    // 1. Insert into contacts table
    const { error: dbError } = await supabase.from('contacts').insert({
      name: name || null,
      phone: phone || null,
      email: email || null,
      source,
      role: role || null,
      note: note || null,
      agency_id: agency_id || null,
    })

    if (dbError) {
      console.error('[Contacts] DB insert error:', dbError)
      // Don't fail the whole request — just log
    }

    // 2. Send Telegram notification
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (BOT_TOKEN && CHAT_ID) {
      const roleEmoji = ROLE_EMOJI[role] ?? '👤'
      const sourceLabel = SOURCE_LABELS[source] ?? source

      const lines = [
        `${roleEmoji} *New Contact — ${sourceLabel}*`,
        ``,
        name  ? `📛 *Name:* ${name}` : null,
        phone ? `📱 *Phone:* ${phone}` : null,
        email ? `📧 *Email:* ${email}` : null,
        note  ? `💬 *Note:* ${note}` : null,
        ``,
        `🕐 ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Tashkent' })}`,
      ].filter(Boolean).join('\n')

      const tgRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: lines, parse_mode: 'Markdown' }),
        }
      )

      if (!tgRes.ok) {
        console.error('[Contacts] Telegram error:', await tgRes.text())
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Contacts] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || ''
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (source) query = query.eq('source', source)
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[Contacts] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contacts: data, total: count })
  } catch (err) {
    console.error('[Contacts] GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
