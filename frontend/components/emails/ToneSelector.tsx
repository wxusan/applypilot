'use client'

import { useState } from 'react'

type Tone = 'encouraging' | 'formal' | 'warm'

interface ToneSelectorProps {
  selectedTone?: Tone
  onSelect?: (tone: Tone) => void
}

const tones: { id: Tone; icon: string; label: string; description: string; iconFill?: boolean }[] = [
  {
    id: 'encouraging',
    icon: 'school',
    label: 'Encouraging & Expert',
    description: 'Authority-led guidance focused on mentorship and growth milestones.',
  },
  {
    id: 'formal',
    icon: 'gavel',
    label: 'Formal & Direct',
    description: 'High-level administrative clarity. Minimal fluff, maximum impact.',
    iconFill: true,
  },
  {
    id: 'warm',
    icon: 'favorite',
    label: 'Warm & Persuasive',
    description: 'Relatable storytelling designed to inspire action and trust.',
  },
]

export default function ToneSelector({
  selectedTone: initialTone = 'formal',
  onSelect,
}: ToneSelectorProps) {
  const [selected, setSelected] = useState<Tone>(initialTone)

  const handleSelect = (tone: Tone) => {
    setSelected(tone)
    onSelect?.(tone)
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/15 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-primary tracking-tight">Selection Tone</h3>
        <span className="material-symbols-outlined text-on-surface-variant">info</span>
      </div>
      <div className="flex flex-col gap-3">
        {tones.map((tone) => (
          <button
            key={tone.id}
            onClick={() => handleSelect(tone.id)}
            className={`w-full text-left p-4 rounded-xl flex items-start gap-4 transition-all duration-200 ${
              selected === tone.id
                ? 'border-2 border-primary bg-surface-container-lowest shadow-lg shadow-primary/5'
                : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-bright hover:shadow-md'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg ${
                selected === tone.id
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white'
                  : tone.id === 'warm'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary-fixed text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={tone.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tone.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-headline font-bold text-sm text-primary">{tone.label}</p>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{tone.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected === tone.id ? 'border-2 border-primary' : 'border border-outline-variant'
            }`}>
              {selected === tone.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
