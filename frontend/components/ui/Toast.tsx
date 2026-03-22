'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} />,
  error: <XCircle size={15} />,
  warning: <AlertCircle size={15} />,
  info: <Info size={15} />,
}

const STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#E1F5EE', border: '#86efac', color: '#0F6E56' },
  error: { bg: '#FCEBEB', border: '#f5c2c2', color: '#A32D2D' },
  warning: { bg: '#FFF8E6', border: '#fde68a', color: '#854F0B' },
  info: { bg: '#EFF6FF', border: '#bfdbfe', color: '#1d4ed8' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<NodeJS.Timeout>()
  const style = STYLES[toast.type]

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-[8px] shadow-md text-[13px] font-medium min-w-[220px] max-w-[340px] animate-slide-up"
      style={{ backgroundColor: style.bg, border: `0.5px solid ${style.border}`, color: style.color }}
    >
      <span className="shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  const ctx: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    warning: (m) => toast(m, 'warning'),
    info: (m) => toast(m, 'info'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast portal */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
