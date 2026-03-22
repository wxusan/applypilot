'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useMemo } from 'react'
import { AlertCircle, X } from 'lucide-react'

const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes

export default function SessionExpiryWarning() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [extending, setExtending] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const expiresAt = session.expires_at! * 1000
      const now = Date.now()
      const timeLeft = expiresAt - now

      if (timeLeft > 0 && timeLeft <= WARNING_BEFORE_MS) {
        setSecondsLeft(Math.floor(timeLeft / 1000))
        setShowWarning(true)
      } else if (timeLeft <= 0) {
        setShowWarning(false)
      } else {
        setShowWarning(false)
      }
    }

    interval = setInterval(() => {
      checkSession()
      if (showWarning) {
        setSecondsLeft(prev => Math.max(0, prev - 1))
      }
    }, 1000)

    checkSession()
    return () => clearInterval(interval)
  }, [supabase, showWarning])

  const handleStayLoggedIn = async () => {
    setExtending(true)
    try {
      await supabase.auth.refreshSession()
      setShowWarning(false)
    } catch {
      // Session refresh failed
    } finally {
      setExtending(false)
    }
  }

  if (!showWarning) return null

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-[8px] shadow-lg max-w-sm w-full mx-4"
      style={{ backgroundColor: '#FFF7ED', border: '0.5px solid #FED7AA' }}
      role="alert"
    >
      <AlertCircle size={15} className="text-orange-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[12px] font-medium text-orange-800">Session expiring soon</p>
        <p className="text-[11px] text-orange-600">
          Your session expires in {minutes}:{String(seconds).padStart(2, '0')}
        </p>
      </div>
      <button
        onClick={handleStayLoggedIn}
        disabled={extending}
        className="shrink-0 h-7 px-3 rounded-[6px] text-[11px] font-medium text-white transition disabled:opacity-60"
        style={{ backgroundColor: '#EA580C' }}
      >
        {extending ? 'Refreshing…' : 'Stay logged in'}
      </button>
      <button
        onClick={() => setShowWarning(false)}
        aria-label="Dismiss session warning"
        className="shrink-0 text-orange-400 hover:text-orange-600 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}
