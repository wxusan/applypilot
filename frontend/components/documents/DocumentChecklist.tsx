'use client'

import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ChecklistItem {
  type: string
  label: string
  required: boolean
  uploaded: boolean
  documents: Array<{
    id: string
    file_name: string
    storage_url: string | null
    status: string
    created_at: string
  }>
}

interface DocumentChecklistProps {
  items: ChecklistItem[]
}

export default function DocumentChecklist({ items }: DocumentChecklistProps) {
  return (
    <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
        <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.5px]">
          Document Checklist
        </p>
      </div>
      <div className="divide-y divide-[#f3f4f6]">
        {items.map((item) => (
          <div key={item.type} className="px-5 py-3 flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {item.uploaded ? (
                <CheckCircle size={16} className="text-[#3B6D11]" />
              ) : (
                <XCircle size={16} className="text-[#A32D2D]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-gray-800">{item.label}</p>
                {item.required && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]"
                    style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}>
                    Required
                  </span>
                )}
              </div>
              {item.documents.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {item.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <FileText size={11} className="text-gray-400 shrink-0" />
                      {doc.storage_url ? (
                        <a
                          href={doc.storage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#185FA5] hover:underline truncate max-w-[280px] flex items-center gap-1"
                        >
                          {doc.file_name}
                          <ExternalLink size={9} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-500 truncate max-w-[280px]">
                          {doc.file_name}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 mt-0.5">Not uploaded</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
