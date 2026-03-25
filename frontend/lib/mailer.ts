/**
 * Gmail SMTP mailer for Next.js API routes.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env.local
 *
 * How to get an App Password:
 *   Google Account → Security → 2-Step Verification → App Passwords
 *   Name it "ApplyPilot" → copy the 16-char password (no spaces)
 */

import nodemailer from 'nodemailer'

const GMAIL_USER = process.env.GMAIL_USER || 'nasux1222@gmail.com'
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ''

let _transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  }
  return _transporter
}

interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMail({ to, subject, html, text }: SendMailOptions): Promise<boolean> {
  if (!GMAIL_APP_PASSWORD) {
    console.error('[mailer] GMAIL_APP_PASSWORD is not set in .env.local')
    return false
  }
  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: `"ApplyPilot" <${GMAIL_USER}>`,
      replyTo: GMAIL_USER,
      to,
      subject,
      html,
      text: text || '',
    })
    console.log(`[mailer] Sent "${subject}" to ${to}`)
    return true
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err)
    return false
  }
}

// ─────────────────────────────────────────────
// HTML Templates
// ─────────────────────────────────────────────

export function resetPasswordEmailHtml(email: string, resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset your ApplyPilot password</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">
    <tr><td align="center">

      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(3,22,53,0.10);">

        <tr>
          <td style="background:linear-gradient(135deg,#031635 0%,#1a2b4b 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;color:rgba(255,255,255,0.45);text-transform:uppercase;">College Consulting Platform</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">✈ ApplyPilot</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 0;">
            <h2 style="margin:0 0 12px;color:#031635;font-size:24px;font-weight:800;">Reset your password</h2>
            <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.7;">
              We received a password reset request for <strong style="color:#031635;">${email}</strong>.
            </p>
            <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7;">
              Click the button below to create a new password. This link is valid for <strong>1 hour</strong>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#031635 0%,#1a2b4b 100%);border-radius:12px;">
                  <a href="${resetLink}"
                     style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                    Create New Password →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              Didn't request a password reset? You can safely ignore this email —
              your password won't change.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Questions?
              <a href="mailto:${GMAIL_USER}" style="color:#031635;font-weight:600;text-decoration:none;">${GMAIL_USER}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
