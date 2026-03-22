'use client'

import { useState, useCallback, useRef } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  retryFn?: () => void
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    if (timerRef.current[id]) clearTimeout(timerRef.current[id])
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, message: string, retryFn?: () => void, duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(ts => [...ts, { id, type, message, retryFn }])
    timerRef.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const success = useCallback((message: string) => show('success', message), [show])
  const error = useCallback((message: string, retryFn?: () => void) => show('error', message, retryFn, 6000), [show])
  const info = useCallback((message: string) => show('info', message), [show])

  return { toasts, success, error, info, dismiss }
}
