'use client'

import { CheckCircle, XCircle, Info, X, RefreshCw } from 'lucide-react'
import type { Toast } from '@/hooks/useToast'

interface Props {
  toasts: Toast[]
  dismiss: (id: string) => void
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: { bg: '#E1F5EE', border: '#A7F3D0', icon: '#1D9E75', text: '#065F46' },
  error: { bg: '#FCEBEB', border: '#FCA5A5', icon: '#DC2626', text: '#991B1B' },
  info: { bg: '#E6F1FB', border: '#BFDBFE', icon: '#185FA5', text: '#1E40AF' },
}

export default function ToastContainer({ toasts, dismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full" aria-live="polite">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type]
        const c = COLORS[toast.type]
        return (
          <div
            key={toast.id}
            role="alert"
            className="flex items-start gap-3 px-4 py-3 rounded-[8px] shadow-lg animate-in slide-in-from-bottom-2"
            style={{ backgroundColor: c.bg, border: `0.5px solid ${c.border}` }}
          >
            <Icon size={15} className="shrink-0 mt-0.5" style={{ color: c.icon }} />
            <p className="text-[13px] flex-1" style={{ color: c.text }}>{toast.message}</p>
            {toast.retryFn && (
              <button
                onClick={toast.retryFn}
                aria-label="Retry"
                className="shrink-0 flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70"
                style={{ color: c.icon }}
              >
                <RefreshCw size={11} />
                Retry
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
