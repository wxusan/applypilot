'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface ChatPanelProps {
  studentId: string
  studentName?: string
}

export default function ChatPanel({ studentId, studentName }: ChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Initialize or load conversation for this student
  const initConversation = useCallback(async () => {
    if (conversationId) return
    try {
      // Try to find existing conversation for this student
      const existing = await apiFetch<any[]>(`/api/chat/conversations?student_id=${studentId}`)
      if (existing && existing.length > 0) {
        const conv = existing[0]
        setConversationId(conv.id)
        // Load message history
        const history = await apiFetch<any[]>(`/api/chat/conversations/${conv.id}/messages`)
        setMessages(
          (history || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        )
      } else {
        // Create a new conversation
        const conv = await apiFetch<any>('/api/chat/conversations', {
          method: 'POST',
          body: JSON.stringify({ student_id: studentId }),
        })
        setConversationId(conv.id)
      }
    } catch (err) {
      console.error('[ChatPanel] init failed:', err)
      setInitError('Failed to load chat. Please try again.')
    }
  }, [studentId, conversationId])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming || !conversationId) return

    setInput('')
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const controller = new AbortController()
      abortRef.current = controller

      // Get auth token
      const { createBrowserClient } = await import('@/lib/supabase-browser')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`API error ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6)
          try {
            const event = JSON.parse(json)
            if (event.type === 'delta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content } : m
                )
              )
            } else if (event.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: `⚠️ ${event.message}` } : m
                )
              )
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: '⚠️ Something went wrong. Please try again.' }
              : m
          )
        )
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleToggle() {
    setOpen((prev) => {
      if (!prev) initConversation()
      return !prev
    })
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleToggle}
        title="Ask Pilot AI"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all hover:opacity-90"
        style={{
          background: 'rgba(3, 22, 53, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#ffffff',
        }}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ color: '#facc15' }}>
          {open ? 'close' : 'auto_awesome'}
        </span>
        <span className="text-sm font-semibold">
          {open ? 'Close' : 'Pilot AI'}
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-40 flex flex-col rounded-3xl shadow-2xl overflow-hidden"
          style={{
            width: '380px',
            height: '520px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ background: '#031635', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#facc15' }}>
              auto_awesome
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Pilot AI</p>
              {studentName && (
                <p className="text-xs truncate" style={{ color: '#94a3b8' }}>
                  Context: {studentName}
                </p>
              )}
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Online" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#f8fafc' }}>
            {initError && (
              <div className="text-xs text-red-500 text-center py-4">{initError}</div>
            )}

            {!initError && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <span className="material-symbols-outlined text-[36px] mb-3" style={{ color: '#cbd5e1' }}>
                  chat
                </span>
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                  Ask anything about{' '}
                  <span className="font-semibold" style={{ color: '#031635' }}>
                    {studentName ?? 'this student'}
                  </span>
                </p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                  Essays, deadlines, strategy, recommendations…
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#031635', color: '#ffffff', borderBottomRightRadius: '6px' }
                      : { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0', borderBottomLeftRadius: '6px' }
                  }
                >
                  {msg.content || (
                    <span className="inline-flex items-center gap-1" style={{ color: '#94a3b8' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
            style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming || !!initError}
              placeholder="Ask Pilot AI…"
              className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none resize-none"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming || !!initError}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-opacity disabled:opacity-40"
              style={{ background: '#031635' }}
            >
              <span className="material-symbols-outlined text-[18px] text-white">
                {streaming ? 'stop' : 'send'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
