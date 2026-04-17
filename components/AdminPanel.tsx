'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs
} from 'firebase/firestore'
import type { Phase } from '@/types'

const STATUS_OPTIONS = [
  { value: 'done', label: 'Concluído' },
  { value: 'wip', label: 'Em andamento' },
  { value: 'plan', label: 'Planejado' },
]

interface Props {
  phases: Phase[]
  onClose: () => void
}

export function AdminPanel({ phases, onClose }: Props) {
  const [view, setView] = useState<'menu' | 'addPhase' | 'editPhase' | 'addItem' | 'editItem'>('menu')
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [selectedItem, setSelectedItem] = useState<{ id: string; label: string; position: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Campos de fase
  const [phaseTitle, setPhaseTitle] = useState('')
  const [phasePeriod, setPhasePeriod] = useState('')
  const [phaseStatus, setPhaseStatus] = useState<'done' | 'wip' | 'plan'>('plan')

  // Campo de item
  const [itemLabel, setItemLabel] = useState('')

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  const openEditPhase = (phase: Phase) => {
    setSelectedPhase(phase)
    setPhaseTitle(phase.title)
    setPhasePeriod(phase.period)
    setPhaseStatus(phase.status)
    setView('editPhase')
  }

  const openAddItem = (phase: Phase) => {
    setSelectedPhase(phase)
    setItemLabel('')
    setView('addItem')
  }

  const openEditItem = (phase: Phase, item: { id: string; label: string; position: number }) => {
    setSelectedPhase(phase)
    setSelectedItem(item)
    setItemLabel(item.label)
    setView('editItem')
  }

  // CRUD fases
  const handleAddPhase = async () => {
    if (!phaseTitle.trim()) return
    setSaving(true)
    const maxPos = phases.length > 0 ? Math.max(...phases.map(p => p.position)) : 0
    await addDoc(collection(db, 'phases'), {
      title: phaseTitle.trim(), period: phasePeriod.trim(),
      status: phaseStatus, position: maxPos + 1,
    })
    setSaving(false)
    flash('Fase adicionada!')
    setView('menu')
  }

  const handleEditPhase = async () => {
    if (!selectedPhase || !phaseTitle.trim()) return
    setSaving(true)
    await updateDoc(doc(db, 'phases', selectedPhase.id), {
      title: phaseTitle.trim(), period: phasePeriod.trim(), status: phaseStatus,
    })
    setSaving(false)
    flash('Fase atualizada!')
    setView('menu')
  }

  const handleDeletePhase = async (phase: Phase) => {
    if (!confirm(`Excluir "${phase.title}" e todos os seus itens?`)) return
    setSaving(true)
    // Deleta itens filhos primeiro
    const itemsSnap = await getDocs(collection(db, 'phases', phase.id, 'items'))
    await Promise.all(itemsSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'phases', phase.id))
    setSaving(false)
    flash('Fase excluída!')
  }

  // CRUD itens
  const handleAddItem = async () => {
    if (!selectedPhase || !itemLabel.trim()) return
    setSaving(true)
    const maxPos = selectedPhase.items.length > 0
      ? Math.max(...selectedPhase.items.map(i => i.position)) : 0
    await addDoc(collection(db, 'phases', selectedPhase.id, 'items'), {
      label: itemLabel.trim(), position: maxPos + 1, checked: false,
    })
    setSaving(false)
    flash('Item adicionado!')
    setView('menu')
  }

  const handleEditItem = async () => {
    if (!selectedPhase || !selectedItem || !itemLabel.trim()) return
    setSaving(true)
    await updateDoc(
      doc(db, 'phases', selectedPhase.id, 'items', selectedItem.id),
      { label: itemLabel.trim() }
    )
    setSaving(false)
    flash('Item atualizado!')
    setView('menu')
  }

  const handleDeleteItem = async (phase: Phase, itemId: string, itemLabel: string) => {
    if (!confirm(`Excluir "${itemLabel}"?`)) return
    setSaving(true)
    await deleteDoc(doc(db, 'phases', phase.id, 'items', itemId))
    setSaving(false)
    flash('Item excluído!')
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1AAF8B] mb-3"
  const btnPrimary = "w-full bg-[#1AAF8B] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#159a7a] disabled:opacity-50 mb-2"
  const btnSecondary = "w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 mb-2"

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-80 h-full overflow-y-auto shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Painel admin</p>
            {msg && <p className="text-xs text-[#1AAF8B] mt-0.5">{msg}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="flex-1 px-4 py-4">

          {/* Menu principal */}
          {view === 'menu' && (
            <>
              <button
                onClick={() => { setPhaseTitle(''); setPhasePeriod(''); setPhaseStatus('plan'); setView('addPhase') }}
                className={btnPrimary}
              >
                + Nova fase
              </button>

              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-4 mb-3">Fases</p>

              {phases.sort((a, b) => a.position - b.position).map(phase => (
                <div key={phase.id} className="border border-gray-100 rounded-xl mb-3 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{phase.title}</span>
                    <button onClick={() => openEditPhase(phase)} className="text-xs text-[#1AAF8B] hover:underline">editar</button>
                    <button onClick={() => handleDeletePhase(phase)} className="text-xs text-red-400 hover:underline">excluir</button>
                  </div>

                  {phase.items.sort((a, b) => a.position - b.position).map(item => (
                    <div key={item.id} className="flex items-start gap-2 px-3 py-1.5 border-t border-gray-100">
                      <span className="text-xs text-gray-500 flex-1 leading-relaxed">{item.label}</span>
                      <button onClick={() => openEditItem(phase, item)} className="text-xs text-[#1AAF8B] hover:underline flex-shrink-0">editar</button>
                      <button onClick={() => handleDeleteItem(phase, item.id, item.label)} className="text-xs text-red-400 hover:underline flex-shrink-0">excluir</button>
                    </div>
                  ))}

                  <div className="px-3 py-2 border-t border-gray-100">
                    <button onClick={() => openAddItem(phase)} className="text-xs text-[#1AAF8B] hover:underline">
                      + adicionar item
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Formulário — nova fase */}
          {(view === 'addPhase' || view === 'editPhase') && (
            <>
              <button onClick={() => setView('menu')} className="text-xs text-gray-400 hover:text-gray-600 mb-4">← voltar</button>
              <p className="text-sm font-medium text-gray-900 mb-4">
                {view === 'addPhase' ? 'Nova fase' : 'Editar fase'}
              </p>
              <label className="text-xs text-gray-500 mb-1 block">Título</label>
              <input className={inputClass} value={phaseTitle} onChange={e => setPhaseTitle(e.target.value)} placeholder="Ex: Governança de TI" />
              <label className="text-xs text-gray-500 mb-1 block">Período</label>
              <input className={inputClass} value={phasePeriod} onChange={e => setPhasePeriod(e.target.value)} placeholder="Ex: Mai – Jun 2026" />
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select className={inputClass} value={phaseStatus} onChange={e => setPhaseStatus(e.target.value as 'done' | 'wip' | 'plan')}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={view === 'addPhase' ? handleAddPhase : handleEditPhase}
                disabled={saving || !phaseTitle.trim()}
                className={btnPrimary}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setView('menu')} className={btnSecondary}>Cancelar</button>
            </>
          )}

          {/* Formulário — novo item / editar item */}
          {(view === 'addItem' || view === 'editItem') && (
            <>
              <button onClick={() => setView('menu')} className="text-xs text-gray-400 hover:text-gray-600 mb-4">← voltar</button>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {view === 'addItem' ? 'Novo item' : 'Editar item'}
              </p>
              <p className="text-xs text-gray-400 mb-4">{selectedPhase?.title}</p>
              <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <textarea
                className={inputClass + ' resize-none'}
                rows={3}
                value={itemLabel}
                onChange={e => setItemLabel(e.target.value)}
                placeholder="Descreva o entregável..."
              />
              <button
                onClick={view === 'addItem' ? handleAddItem : handleEditItem}
                disabled={saving || !itemLabel.trim()}
                className={btnPrimary}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setView('menu')} className={btnSecondary}>Cancelar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}