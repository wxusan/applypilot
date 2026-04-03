import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateMono(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function deadlineClass(date: string | Date | null | undefined): string {
  const days = daysUntil(date)
  if (days === null) return 'text-gray-400 font-mono text-[11px]'
  if (days <= 3) return 'text-[#A32D2D] font-medium font-mono text-[11px]'
  if (days <= 7) return 'text-[#854F0B] font-mono text-[11px]'
  return 'text-gray-500 font-mono text-[11px]'
}

export type StudentStatus =
  | 'intake'
  | 'forms'
  | 'writing'
  | 'review'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'archived'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  intake:    { bg: '#E1F5EE', color: '#0F6E56', label: 'Intake' },
  forms:     { bg: '#E6F1FB', color: '#185FA5', label: 'Forms' },
  writing:   { bg: '#FAEEDA', color: '#854F0B', label: 'Writing' },
  review:    { bg: '#FBEAF0', color: '#993556', label: 'Review' },
  submitted: { bg: '#EAF3DE', color: '#3B6D11', label: 'Submitted' },
  accepted:  { bg: '#EAF3DE', color: '#3B6D11', label: 'Accepted' },
  rejected:  { bg: '#FCEBEB', color: '#A32D2D', label: 'Rejected' },
  archived:  { bg: '#F0F0F0', color: '#6B7280', label: 'Archived' },
  waitlisted:{ bg: '#FAEEDA', color: '#854F0B', label: 'Waitlisted' },
  pending:   { bg: '#E6F1FB', color: '#185FA5', label: 'Pending' },
  draft:     { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  approved:  { bg: '#EAF3DE', color: '#3B6D11', label: 'Approved' },
  running:   { bg: '#E6F1FB', color: '#185FA5', label: 'Running' },
  failed:    { bg: '#FCEBEB', color: '#A32D2D', label: 'Failed' },
  completed: { bg: '#EAF3DE', color: '#3B6D11', label: 'Completed' },
  awaiting_approval: { bg: '#FAEEDA', color: '#854F0B', label: 'Needs Review' },
  not_started: { bg: '#F3F4F6', color: '#6B7280', label: 'Not Started' },
}

export function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
}

export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max) + '…'
}

export function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

export function agentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    coordinator: 'Coordinator',
    intake: 'Intake',
    writer: 'Writer',
    email_agent: 'Email',
    browser: 'Browser',
    deadline_tracker: 'Deadline Tracker',
    document_processor: 'Document Processor',
  }
  return labels[type] ?? type
}
