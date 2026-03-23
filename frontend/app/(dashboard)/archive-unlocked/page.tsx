'use client'

import { useRouter } from 'next/navigation'
import ArchiveUnlockedModal from '@/components/ui/ArchiveUnlockedModal'

export default function ArchiveUnlockedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex items-center justify-center selection:bg-primary-fixed selection:text-primary">
      {/* Transactional Screen: Navigation Suppressed */}
      <ArchiveUnlockedModal onEnterWorkspace={() => router.push('/dashboard')} />

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-fixed/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  )
}
