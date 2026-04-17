'use client'
import { useState } from 'react'
import { ProgressBar } from './ProgressBar'
import type { Phase } from '@/types'

const STATUS = {
  done: { dot: '#1AAF8B', bg: '#E0F5EF', text: '#0D5C47', label: 'Concluído' },
  wip: { dot: '#F5A623', bg: '#FEF6E4', text: '#7A4F00', label: 'Em andamento' },
  plan: { dot: '#9CA3AF', bg: '#F3F4F6', text: '#4B5563', label: 'Planejado' },
}

interface Props {
  phase: Phase
  onToggle: (phaseId: string, itemId: string, checked: boolean) => void
}

export function PhaseCard({ phase, onToggle }: Props) {
  const [open, setOpen] = useState(phase.status === 'wip')
  const sc = STATUS[phase.status]
  const done = phase.items.filter(i => i.checked).length
  const pct = phase.items.length > 0 ? Math.round((done / phase.items.length) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{ background: sc.dot, color: '#fff' }}
        >
          {phase.position}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{phase.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {phase.period}
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: sc.bg, color: sc.text }}
            >
              {sc.label}
            </span>
          </p>
        </div>
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: pct === 100 ? '#1AAF8B' : '#6B7280' }}
        >
          {pct}%
        </span>
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      <ProgressBar value={pct} color={sc.dot} height={3} />

      {open && (
        <div className="px-4 pb-3 pt-1 pl-14">
          {phase.items
            .sort((a, b) => a.position - b.position)
            .map(item => (
              <div
                key={item.id}
                onClick={() => onToggle(phase.id, item.id, !item.checked)}
                className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0 cursor-pointer group"
              >
                <div
                  className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border flex items-center justify-center transition-all ${item.checked
                      ? 'bg-[#1AAF8B] border-[#1AAF8B]'
                      : 'border-gray-300 group-hover:border-[#1AAF8B]'
                    }`}
                >
                  {item.checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm leading-relaxed ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}>
                  {item.label}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}