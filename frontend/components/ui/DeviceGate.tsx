'use client'

import { useEffect, useState } from 'react'
import { Monitor, Tablet } from 'lucide-react'

type DeviceType = 'desktop' | 'tablet-ok' | 'tablet-small' | 'mobile' | 'checking'

function getDeviceType(width: number, userAgent: string): DeviceType {
  const isMobileUA =
    /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTabletUA =
    /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent) ||
    // iPad on iOS 13+ reports as "Macintosh" but has maxTouchPoints > 1
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(userAgent))

  // Explicit mobile phone UA
  if (isMobileUA) return 'mobile'

  // Viewport-based check (covers any browser width)
  if (width < 768) return 'mobile'

  // Tablet range
  if (isTabletUA || width < 1100) {
    // Wide enough for a usable experience (e.g. iPad Pro landscape)
    return width >= 1100 ? 'tablet-ok' : 'tablet-small'
  }

  return 'desktop'
}

export default function DeviceGate({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceType>('checking')
  const [tabletDismissed, setTabletDismissed] = useState(false)

  useEffect(() => {
    const check = () => {
      const type = getDeviceType(window.innerWidth, navigator.userAgent)
      setDevice(type)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // First render — avoid flash
  if (device === 'checking') return null

  // Mobile → full block
  if (device === 'mobile') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-5"
          style={{ backgroundColor: '#E1F5EE' }}
        >
          <Monitor size={26} style={{ color: '#1D9E75' }} />
        </div>
        <h1 className="text-[20px] font-semibold text-gray-900 mb-2">
          Open on a computer
        </h1>
        <p className="text-[14px] text-gray-500 max-w-[280px] leading-relaxed">
          ApplyPilot is designed for desktop use. Please open it on your computer for the full experience.
        </p>
        <div className="mt-8 text-[12px] text-gray-300">
          applypilot.com
        </div>
      </div>
    )
  }

  // Tablet too narrow → warning with option to dismiss and continue
  if (device === 'tablet-small' && !tabletDismissed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-5"
          style={{ backgroundColor: '#FFF8E6' }}
        >
          <Tablet size={26} style={{ color: '#854F0B' }} />
        </div>
        <h1 className="text-[20px] font-semibold text-gray-900 mb-2">
          Screen may be too small
        </h1>
        <p className="text-[14px] text-gray-500 max-w-[320px] leading-relaxed mb-2">
          ApplyPilot works best on a wide screen. Your current viewport may cut off parts of the interface.
        </p>
        <p className="text-[13px] text-gray-400 max-w-[300px] leading-relaxed">
          Try rotating your tablet to landscape mode, or switch to a computer for the best experience.
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full max-w-[280px]">
          <button
            onClick={() => setTabletDismissed(true)}
            className="w-full h-10 rounded-[8px] text-[14px] font-medium text-white transition"
            style={{ backgroundColor: '#1D9E75' }}
          >
            Continue anyway
          </button>
          <p className="text-[11px] text-gray-400">
            Some features may not display correctly
          </p>
        </div>
      </div>
    )
  }

  // desktop, tablet-ok, or tablet-small after dismissal
  return <>{children}</>
}
