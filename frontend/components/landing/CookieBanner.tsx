'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('ap_cookies_accepted')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('ap_cookies_accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#111] border-t border-white/10 px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
      role="dialog"
      aria-label="Cookie consent"
    >
      <p className="text-[13px] text-gray-300 flex-1 min-w-[200px]">
        We use cookies to improve your experience. By using ApplyPilot, you agree to our{' '}
        <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={accept}
          className="h-8 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-[12px] font-medium text-white transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss cookie banner"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
