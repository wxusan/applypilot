'use client'

interface Props {
  screenshots: string[]
  universityName: string
  onClose: () => void
}

export default function BrowserAgentScreenshotsModal({ screenshots, universityName, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
              Browser Agent Screenshots
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {universityName} — {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#6B7280',
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Screenshot grid */}
        <div
          style={{
            overflowY: 'auto',
            padding: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {screenshots.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}
            >
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                loading="lazy"
              />
              <p style={{ margin: 0, padding: '6px 10px', fontSize: 11, color: '#6B7280', background: '#f9fafb' }}>
                Step {i + 1}
              </p>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 7,
              background: '#1D9E75',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Done — I&apos;ll submit manually
          </button>
        </div>
      </div>
    </div>
  )
}
