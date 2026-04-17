'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { PhaseCard } from '@/components/PhaseCard'
import { ProgressBar } from '@/components/ProgressBar'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminPanel } from '@/components/AdminPanel'
import type { Phase, Item } from '@/types'

export default function Home() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    const unsubscribers: (() => void)[] = []
    const phasesQuery = query(collection(db, 'phases'), orderBy('position'))

    const unsubPhases = onSnapshot(phasesQuery, snapshot => {
      const phaseDocs: Phase[] = snapshot.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          position: data.position,
          title: data.title,
          period: data.period,
          status: data.status as Phase['status'],
          items: [],
        }
      })
      setPhases(phaseDocs)
      setLoading(false)

      phaseDocs.forEach(phase => {
        const itemsQuery = query(
          collection(db, 'phases', phase.id, 'items'),
          orderBy('position')
        )
        const unsubItems = onSnapshot(itemsQuery, itemSnap => {
          const items = itemSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Item[]
          setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, items } : p))
        })
        unsubscribers.push(unsubItems)
      })
    })

    return () => { unsubPhases(); unsubscribers.forEach(fn => fn()) }
  }, [])

  const handleToggle = async (phaseId: string, itemId: string, checked: boolean) => {
    setPhases(prev => prev.map(p => p.id !== phaseId ? p : {
      ...p, items: p.items.map(i => i.id === itemId ? { ...i, checked } : i)
    }))
    await updateDoc(doc(db, 'phases', phaseId, 'items', itemId), { checked })
  }

  const allItems = phases.flatMap(p => p.items)
  const totalDone = allItems.filter(i => i.checked).length
  const totalAll = allItems.length
  const globalPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Carregando...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-medium tracking-widest text-[#1AAF8B] uppercase mb-1">Energia de Todos</p>
            <h1 className="text-2xl font-semibold text-gray-900">Roadmap de TI</h1>
            <p className="text-sm text-gray-400 mt-1">Fevereiro – Setembro 2026</p>
          </div>
          <button
            onClick={() => isAdmin ? setShowPanel(true) : setShowLogin(true)}
            className="text-xs text-gray-300 hover:text-gray-400 mt-1"
          >
            {isAdmin ? '⚙ admin' : '⚙'}
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'concluídos', value: totalDone },
            { label: 'entregáveis', value: totalAll },
            { label: 'do roadmap', value: `${globalPct}%` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Barra global */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progresso geral</span><span>{totalDone} / {totalAll}</span>
          </div>
          <ProgressBar value={globalPct} height={6} />
        </div>

        {/* Fases */}
        {phases.map(phase => (
          <PhaseCard key={phase.id} phase={phase} onToggle={handleToggle} />
        ))}

        <p className="text-center text-xs text-gray-300 mt-8">
          Área de TI · Energia de Todos · 2026
        </p>
      </div>

      {/* Modais */}
      {showLogin && (
        <AdminLogin
          onSuccess={() => { setIsAdmin(true); setShowLogin(false); setShowPanel(true) }}
          onCancel={() => setShowLogin(false)}
        />
      )}
      {showPanel && isAdmin && (
        <AdminPanel phases={phases} onClose={() => setShowPanel(false)} />
      )}
    </main>
  )
}