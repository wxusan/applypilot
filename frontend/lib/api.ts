const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Token is managed by Supabase SSR — retrieve from cookie/session
  if (typeof window !== 'undefined') {
    const { createBrowserClient } = await import('./supabase-browser')
    const supabase = createBrowserClient()
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
    throw new Error(body.detail || `API error ${res.status}`)
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
