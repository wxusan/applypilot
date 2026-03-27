'use client'

import { useState, useRef, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { apiFetch } from '@/lib/api'

interface Props {
  agency: Record<string, unknown> | null
  user: Record<string, unknown> | null
  role: string
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'uz', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
]

const TIMEZONES = [
  { value: 'Asia/Tashkent',    label: 'Asia/Tashkent (UTC+5)' },
  { value: 'Asia/Almaty',      label: 'Asia/Almaty (UTC+6)' },
  { value: 'Europe/Moscow',    label: 'Europe/Moscow (UTC+3)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago',  label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London',    label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin',    label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Dubai',       label: 'Asia/Dubai (UTC+4)' },
  { value: 'Asia/Karachi',     label: 'Asia/Karachi (PKT)' },
  { value: 'Asia/Kolkata',     label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Singapore',   label: 'Asia/Singapore (SGT)' },
  { value: 'UTC',              label: 'UTC' },
]

const PRESET_COLORS = [
  '#1D9E75', '#0F6E56', '#3B82F6', '#8B5CF6',
  '#F59E0B', '#EF4444', '#EC4899', '#6B7280',
]

export default function SettingsForm({ agency, user, role }: Props) {
  const supabase = useMemo(() => createBrowserClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  // Profile
  const [telegramId, setTelegramId] = useState((user?.telegram_chat_id as string) ?? '')

  // Agency
  const [agencyName, setAgencyName] = useState((agency?.name as string) ?? '')
  const [primaryColor, setPrimaryColor] = useState((agency?.primary_color as string) ?? '#1D9E75')
  const [language, setLanguage] = useState((agency?.language as string) ?? 'en')
  const [timezone, setTimezone] = useState((agency?.timezone as string) ?? 'Asia/Tashkent')
  const [logoUrl, setLogoUrl] = useState((agency?.logo_url as string) ?? '')
  const [logoUploading, setLogoUploading] = useState(false)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Logo must be under 2 MB')
      return
    }
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Retrieve JWT so the upload endpoint can authenticate
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token ?? ''

      // Use ?? (not ||) so empty string env var stays empty → relative URL works in production
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res: { url: string } = await fetch(`${API_URL}/api/settings/agency/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).then((r) => {
        if (!r.ok) throw new Error('Upload failed')
        return r.json()
      })
      setLogoUrl(res.url)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLogoUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify({ telegram_chat_id: telegramId }),
      })

      if (role === 'admin' && agency) {
        await apiFetch('/api/settings/agency', {
          method: 'PATCH',
          body: JSON.stringify({
            name: agencyName,
            primary_color: primaryColor,
            language,
            timezone,
            ...(logoUrl ? { logo_url: logoUrl } : {}),
          }),
        })
      }

      showToast('success', 'Settings saved successfully.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition'
  const inputStyle = { border: '0.5px solid #d1d5db' }
  const labelClass = 'block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5'

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* ── Profile ── */}
      <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={(user?.full_name as string) ?? ''}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={(user?.email as string) ?? ''}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Telegram Chat ID</label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="e.g. 123456789"
              className={inputClass}
              style={inputStyle}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Start a chat with the bot and send <code>/start</code> to get your Chat ID.
            </p>
          </div>
        </div>
      </div>

      {/* ── Agency Settings (admin only) ── */}
      {role === 'admin' && agency && (
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Agency Settings</h2>
          <div className="space-y-4">
            {/* Agency name */}
            <div>
              <label className={labelClass}>Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Logo upload */}
            <div>
              <label className={labelClass}>Agency Logo</label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Agency logo"
                    className="h-10 w-10 rounded-[6px] object-contain border border-gray-200"
                  />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={() => fileRef.current?.click()}
                  className="h-9 px-4 rounded-[6px] text-[12px] font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
                  style={{ border: '0.5px solid #d1d5db' }}
                >
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[11px] text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, SVG — max 2 MB</p>
            </div>

            {/* Primary color */}
            <div>
              <label className={labelClass}>Brand Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    className="w-7 h-7 rounded-full transition"
                    style={{
                      backgroundColor: c,
                      outline: primaryColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
                <div className="flex items-center gap-2 ml-1">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer"
                    style={{ padding: 1, border: '0.5px solid #d1d5db' }}
                  />
                  <span className="text-[12px] font-mono text-gray-500">{primaryColor}</span>
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className={labelClass}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className={labelClass}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Plan (read-only) */}
            <div>
              <label className={labelClass}>Subscription Plan</label>
              <input
                type="text"
                value={(agency.subscription_plan as string) ?? ''}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-400 capitalize`}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: '#1D9E75' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 rounded-[8px] px-4 py-3 text-[13px] font-medium text-white shadow-lg z-50"
          style={{ backgroundColor: toast.type === 'success' ? '#1D9E75' : '#B91C1C' }}
        >
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}
    </form>
  )
}
