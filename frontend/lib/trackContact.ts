/**
 * trackContact — fire-and-forget contact tracking
 *
 * Call this after any successful form submission to log the person
 * into the contacts DB and ping Telegram. Never throws — silently
 * swallows errors so it never breaks the main form flow.
 */
export interface ContactPayload {
  name?: string
  phone?: string
  email?: string
  source: 'waitlist' | 'access_request' | 'student' | 'staff_invite' | 'agency_created'
  role?: 'prospect' | 'student' | 'staff' | 'agency_owner'
  note?: string
  agency_id?: string
}

export async function trackContact(payload: ContactPayload): Promise<void> {
  try {
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Silent — never interrupt the user flow
  }
}
