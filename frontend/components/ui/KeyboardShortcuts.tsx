'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const G_SHORTCUTS: Record<string, string> = {
  'd': '/dashboard',
  's': '/students',
  'a': '/approvals',
  'k': '/kanban',
  'r': '/reports',
  'n': '/analytics',
  'e': '/settings',
}

export default function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let gPressed = false
    let gTimer: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input, textarea, or select
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return
      // Don't trigger with modifier keys (allow Cmd+K, Ctrl+K via CommandPalette)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // "N" → new student (direct shortcut, no G prefix needed)
      if (e.key === 'n' || e.key === 'N') {
        if (!gPressed) {
          e.preventDefault()
          router.push('/students/new')
          return
        }
      }

      // G+<key> navigation shortcuts
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true
        clearTimeout(gTimer)
        gTimer = setTimeout(() => { gPressed = false }, 1000)
        return
      }

      if (gPressed) {
        const dest = G_SHORTCUTS[e.key.toLowerCase()]
        if (dest) {
          e.preventDefault()
          gPressed = false
          clearTimeout(gTimer)
          router.push(dest)
        }
        return
      }

      // Backspace on student list → no-op (handled by browser)
      // ESC handled per-component (command palette, modals)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, pathname])

  return null
}
