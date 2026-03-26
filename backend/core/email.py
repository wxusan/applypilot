"""
Resend email utility for ApplyPilot.

Requires env vars:
  RESEND_API_KEY – API key from resend.com
  GMAIL_USER     – used as the reply-to address
"""

import resend
import logging
from core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str, text: str = "") -> bool:
    """Send an email via Resend. Returns True on success, False on failure."""
    try:
        resend.api_key = settings.RESEND_API_KEY

        params: resend.Emails.SendParams = {
            "from": "ApplyPilot <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": html,
            "reply_to": settings.GMAIL_USER,
        }
        if text:
            params["text"] = text

        resend.Emails.send(params)
        logger.info(f"[email] Sent '{subject}' to {to}")
        return True

    except Exception as e:
        logger.error(f"[email] Failed to send '{subject}' to {to}: {type(e).__name__}: {e}")
        return False


# ─────────────────────────────────────────────
# Email templates
# ─────────────────────────────────────────────

def invite_email_html(owner_name: str, agency_name: str, plan: str, activate_link: str) -> str:
    name = owner_name.strip() or "there"
    plan_label = plan.capitalize()
    support_email = settings.GMAIL_USER
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You're invited to ApplyPilot</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(3,22,53,0.10);">

        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(135deg,#031635 0%,#1a2b4b 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;color:rgba(255,255,255,0.45);text-transform:uppercase;">College Consulting Platform</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">✈ ApplyPilot</h1>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:40px 40px 0;">
            <h2 style="margin:0 0 12px;color:#031635;font-size:26px;font-weight:800;line-height:1.2;">
              Welcome aboard, {name}! 🎉
            </h2>
            <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
              You've been set up as the owner of <strong style="color:#031635;">{agency_name}</strong>
              on ApplyPilot (<em>{plan_label} plan</em>).
            </p>
            <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7;">
              To activate your account, you need to <strong style="color:#031635;">set a password</strong> first.
              This only takes a few seconds — click the button below.
            </p>
          </td>
        </tr>

        <!-- CTA button -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#031635 0%,#1a2b4b 100%);border-radius:12px;">
                  <a href="{activate_link}"
                     style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
                    Set Password &amp; Activate Account →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Steps info box -->
        <tr>
          <td style="padding:0 40px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 14px;color:#94a3b8;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                    What happens next
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 14px 0 0;vertical-align:top;">
                        <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#031635;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</span>
                      </td>
                      <td style="padding-bottom:10px;color:#334155;font-size:14px;line-height:1.5;">
                        Click the button above and set your password
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 14px 0 0;vertical-align:top;">
                        <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#031635;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</span>
                      </td>
                      <td style="padding-bottom:10px;color:#334155;font-size:14px;line-height:1.5;">
                        You'll land straight in your agency dashboard
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 14px 0 0;vertical-align:top;">
                        <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#031635;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</span>
                      </td>
                      <td style="color:#334155;font-size:14px;line-height:1.5;">
                        Log in any time with email &amp; password, or continue with Google
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;line-height:1.6;">
              This activation link expires in <strong>24 hours</strong>.
              If you weren't expecting this, you can safely ignore it.
            </p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Need help? Contact us at
              <a href="mailto:{support_email}" style="color:#031635;font-weight:600;text-decoration:none;">{support_email}</a>
              or reach out on Telegram.
            </p>
          </td>
        </tr>

      </table>
      <!-- End card -->

    </td></tr>
  </table>
</body>
</html>"""


def reset_password_email_html(email: str, reset_link: str) -> str:
    support_email = settings.GMAIL_USER
    return f"""<!DOCTYPE html>
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
              We received a password reset request for <strong style="color:#031635;">{email}</strong>.
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
                  <a href="{reset_link}"
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
              <a href="mailto:{support_email}" style="color:#031635;font-weight:600;text-decoration:none;">{support_email}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
