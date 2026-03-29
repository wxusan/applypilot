// Empty string = same-origin relative URLs (/api/...) which go through
// the Next.js proxy rewrites defined in next.config.js.
// This eliminates all cross-origin fetch issues (CORS "Failed to fetch").
// In production, set NEXT_PUBLIC_API_URL='' (or leave unset) and configure
// BACKEND_URL in Vercel env vars for the server-side proxy.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// Singleton Supabase browser client — avoids re-creating on every API call
let _supabaseClient: any = null
function getSupabaseClient() {
  if (!_supabaseClient && typeof window !== 'undefined') {
    const { createBrowserClient } = require('./supabase-browser')
    _supabaseClient = createBrowserClient()
  }
  return _supabaseClient
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }
    }
  }
  return { 'Content-Type': 'application/json' }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    // FastAPI 422 validation errors return detail as an array of {loc, msg, type}
    let message: string
    if (Array.isArray(body.detail)) {
      message = body.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
    } else {
      message = body.detail || body.message || `API error ${res.status}`
    }
    throw new Error(message)
  }

  // 204 No Content (DELETE responses) — return undefined instead of trying to parse empty body
  if (res.status === 204) return undefined as unknown as T

  return res.json()
}

// Students
export const studentsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ students: unknown[]; total: number }>(`/api/students${qs}`)
  },
  get: (id: string) => apiFetch<unknown>(`/api/students/${id}`),
  create: (data: unknown) => apiFetch<unknown>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<unknown>(`/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/students/${id}`, { method: 'DELETE' }),
}

// Applications
export const applicationsApi = {
  list: (studentId: string) => apiFetch<{ applications: unknown[] }>(`/api/applications?student_id=${studentId}`),
  get: (id: string) => apiFetch<unknown>(`/api/applications/${id}`),
  create: (data: unknown) => apiFetch<unknown>('/api/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<unknown>(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// Documents
export const documentsApi = {
  list: (studentId: string) => apiFetch<{ documents: unknown[] }>(`/api/documents?student_id=${studentId}`),
  upload: async (studentId: string, formData: FormData) => {
    // Must send auth header manually — FormData upload can't go through apiFetch (no Content-Type override)
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { Authorization: authHeaders.Authorization ?? '' },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(body.detail || `Upload failed ${res.status}`)
    }
    return res.json()
  },
  delete: (id: string) => apiFetch<void>(`/api/documents/${id}`, { method: 'DELETE' }),
}

// Essays
export const essaysApi = {
  list: (studentId: string) => apiFetch<{ essays: unknown[] }>(`/api/essays?student_id=${studentId}`),
  get: (id: string) => apiFetch<unknown>(`/api/essays/${id}`),
  generate: (data: unknown) => apiFetch<unknown>('/api/essays/generate', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<unknown>(`/api/essays/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  approve: (id: string) => apiFetch<unknown>(`/api/essays/${id}/approve`, { method: 'POST' }),
}

// Agent Jobs
export const agentJobsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ jobs: unknown[]; total: number }>(`/api/agent-jobs${qs}`)
  },
  approve: (id: string) => apiFetch<unknown>(`/api/agent-jobs/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    apiFetch<unknown>(`/api/agent-jobs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
}

// Browser Agent
export const browserAgentApi = {
  start: (studentId: string, applicationId: string) =>
    apiFetch<{ job_id: string; status: string; message: string }>(
      '/api/agents/browser/start',
      {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, application_id: applicationId }),
      }
    ),
  status: (jobId: string) =>
    apiFetch<{ job_id: string; status: string; screenshots: string[]; message: string; output_data: unknown; created_at: string }>(
      `/api/agents/browser/${jobId}`
    ),
  stop: (jobId: string) =>
    apiFetch<{ job_id: string; status: string; message: string }>(
      `/api/agents/browser/${jobId}/stop`,
      { method: 'POST' }
    ),
}

// Emails
export const emailsApi = {
  list: (studentId: string, params?: Record<string, string>) => {
    const base = { student_id: studentId, limit: '100', ...params }
    return apiFetch<{ emails: unknown[]; total: number }>(`/api/emails?${new URLSearchParams(base).toString()}`)
  },
  get: (id: string) => apiFetch<unknown>(`/api/emails/${id}`),
  approveDraft: (id: string) => apiFetch<unknown>(`/api/emails/${id}/approve-draft`, { method: 'POST' }),
}

// Notifications
export const notificationsApi = {
  unreadCount: () => apiFetch<{ count: number }>('/api/notifications/unread-count'),
  list: (limit = 20) => apiFetch<unknown[]>(`/api/notifications/?limit=${limit}`),
  markRead: (id: string) => apiFetch<unknown>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiFetch<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),
}

// College Fit
export const collegeFitApi = {
  get: (studentId: string, refresh = false) =>
    apiFetch<{ recommendations: unknown[]; generated_at: string; cached: boolean }>(
      `/api/students/${studentId}/college-fit${refresh ? '?refresh=true' : ''}`
    ),
}

// Deadlines
export const deadlinesApi = {
  list: (studentId?: string) => {
    const qs = studentId ? `?student_id=${studentId}` : ''
    return apiFetch<{ deadlines: unknown[] }>(`/api/deadlines${qs}`)
  },
  create: (data: unknown) => apiFetch<unknown>('/api/deadlines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiFetch<unknown>(`/api/deadlines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/deadlines/${id}`, { method: 'DELETE' }),
  complete: (id: string) => apiFetch<unknown>(`/api/deadlines/${id}/complete`, { method: 'POST' }),
  uncomplete: (id: string) => apiFetch<unknown>(`/api/deadlines/${id}/uncomplete`, { method: 'POST' }),
}
