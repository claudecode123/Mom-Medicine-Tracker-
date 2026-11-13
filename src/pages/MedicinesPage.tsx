import { useState } from 'react'
import { Plus, Pill, Edit, PackagePlus, Archive, ChevronDown, ChevronUp, AlertTriangle, Tag, X } from 'lucide-react'
import { OrganIconChip } from '@/components/common/OrganIconChip'
import { useMedicines, useArchiveMedicine } from '@/hooks/useMedicines'
import { useAlternativeBrands, useAddAlternativeBrand, useDeleteAlternativeBrand, useSetPreferredBrand } from '@/hooks/useAlternativeBrands'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { MedicineForm } from '@/components/medicines/MedicineForm'
import { AddStockModal } from '@/components/medicines/AddStockModal'
import { StockBadge } from '@/components/common/StockBadge'
import type { Medicine } from '@/types/database'
import { cn, stockStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

type View = 'list' | 'add' | 'edit'

function AlternativeBrandsSection({ medicine }: { medicine: Medicine }) {
  const { data: brands = [] } = useAlternativeBrands(medicine.id)
  const addBrand = useAddAlternativeBrand()
  const deleteBrand = useDeleteAlternativeBrand()
  const setPreferred = useSetPreferredBrand()
  const [newBrand, setNewBrand] = useState('')

  if (brands.length === 0 && !medicine.is_critical) return null

  return (
    <div className="bg-blue-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-blue-700">Alternative Brands</p>
      {brands.length === 0 && <p className="text-xs text-warm-400">No alternatives set</p>}
      <div className="flex flex-wrap gap-1.5">
        {brands.map(b => (
          <div key={b.id} className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
            medicine.preferred_brand === b.brand_name
              ? 'bg-brand-100 text-brand-700'
              : 'bg-white text-warm-700 border border-warm-200'
          )}>
            <button
              onClick={() => setPreferred.mutate({ medicineId: medicine.id, brand: b.brand_name })}
              title="Set as preferred"
              className="hover:text-brand-600"
            >
              {b.brand_name}
              {medicine.preferred_brand === b.brand_name && ' ★'}
            </button>
            {b.notes && <span className="text-amber-500">⚠</span>}
            <button
              onClick={() => deleteBrand.mutate({ id: b.id, medicineId: medicine.id })}
              className="text-warm-300 hover:text-red-500 ml-0.5"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1">
        <input
          value={newBrand}
          onChange={e => setNewBrand(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (newBrand.trim()) {
                addBrand.mutate({ medicineId: medicine.id, brandName: newBrand.trim() })
                setNewBrand('')
              }
            }
          }}
          placeholder="Add brand name…"
          className="input-field text-xs py-1.5 flex-1"
        />
        <button
          onClick={() => {
            if (newBrand.trim()) {
              addBrand.mutate({ medicineId: medicine.id, brandName: newBrand.trim() })
              setNewBrand('')
            }
          }}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Add
        </button>
      </div>
      {medicine.preferred_brand && (
        <p className="text-xs text-warm-400">★ = preferred brand (tap to change)</p>
      )}
    </div>
  )
}

export function MedicinesPage() {
  const { data: medicines, isLoading } = useMedicines()
  const archiveMed = useArchiveMedicine()
  const { isAdmin } = useAuth()
  const [view, setView] = useState<View>('list')
  const [editingMed, setEditingMed] = useState<Medicine | null>(null)
  const [stockModalMed, setStockModalMed] = useState<Medicine | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<string | null>(null)

  if (isLoading) return <PageLoader />

  if (view === 'add') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-xl font-bold text-warm-800">Add Medicine</h1>
        </div>
        <div className="card">
          <MedicineForm onSave={() => setView('list')} onCancel={() => setView('list')} />
        </div>
      </div>
    )
  }

  if (view === 'edit' && editingMed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setEditingMed(null) }} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-xl font-bold text-warm-800">Edit Medicine</h1>
        </div>
        <div className="card">
          <MedicineForm
            medicine={editingMed as any}
            onSave={() => { setView('list'); setEditingMed(null) }}
            onCancel={() => { setView('list'); setEditingMed(null) }}
          />
        </div>
      </div>
    )
  }

  const activeMeds = medicines?.filter(m => !m.archived_at) ?? []
  const criticalMeds = activeMeds.filter(m => m.is_critical)
  const lowStock = activeMeds.filter(m => stockStatusColor(m.current_stock) !== 'ok')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-800">Medicines</h1>
        {isAdmin && (
          <button onClick={() => setView('add')} className="btn-primary px-4 py-2.5 text-sm">
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Stats row */}
      {activeMeds.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card py-2">
            <p className="text-xl font-bold text-warm-800">{activeMeds.length}</p>
            <p className="text-xs text-warm-400">Total</p>
          </div>
          <div className="card py-2">
            <p className="text-xl font-bold text-red-500">{criticalMeds.length}</p>
            <p className="text-xs text-warm-400">Critical</p>
          </div>
          <div className="card py-2">
            <p className="text-xl font-bold text-amber-500">{lowStock.length}</p>
            <p className="text-xs text-warm-400">Low Stock</p>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">{lowStock.length} medicine{lowStock.length !== 1 ? 's' : ''} running low on stock</p>
        </div>
      )}

      {activeMeds.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medicines added yet"
          description="Add your first medicine to start tracking doses and stock."
          action={<button onClick={() => setView('add')} className="btn-primary">Add Medicine</button>}
        />
      ) : (
        <div className="space-y-3">
          {activeMeds.map(med => {
            const isExpanded = expandedId === med.id

            return (
              <div key={med.id} className={cn('card border', med.is_critical ? 'border-red-100' : 'border-warm-100')}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : med.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <OrganIconChip name={med.name} size={40} radius={12} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-warm-800">{med.name}</p>
                          {med.is_critical && (
                            <span className="text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-medium">Critical</span>
                          )}
                          {med.needs_confirmation && (
                            <span className="text-xs bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5">⚠ Verify</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {med.strength && <span className="text-xs text-warm-400">{med.strength}</span>}
                          {med.category && (
                            <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                              <Tag size={9} /> {med.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <StockBadge daysRemaining={med.current_stock} stockUnit={med.stock_unit} />
                        {isExpanded ? <ChevronUp size={16} className="text-warm-400" /> : <ChevronDown size={16} className="text-warm-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-warm-500">
                      <span>{med.current_stock} {med.stock_unit} in stock</span>
                      {med.preferred_brand && <span>Preferred: {med.preferred_brand}</span>}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-warm-100 space-y-3">
                    {med.instructions && (
                      <p className="text-sm text-warm-600 italic">"{med.instructions}"</p>
                    )}

                    {med.needs_confirmation && med.confirmation_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">{med.confirmation_notes}</p>
                      </div>
                    )}

                    {isAdmin && <AlternativeBrandsSection medicine={med} />}

                    {med.refill_notes && (
                      <p className="text-sm text-warm-500">📝 {med.refill_notes}</p>
                    )}

                    {isAdmin && (
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { setEditingMed(med); setView('edit') }}
                          className="btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => setStockModalMed(med)}
                          className="btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
                          <PackagePlus size={14} /> Stock
                        </button>
                        <button
                          onClick={() => setShowArchiveConfirm(showArchiveConfirm === med.id ? null : med.id)}
                          className="btn-secondary text-sm py-2 flex items-center justify-center gap-1.5 text-warm-500">
                          <Archive size={14} /> Archive
                        </button>
                      </div>
                    )}

                    {isAdmin && showArchiveConfirm === med.id && (
                      <div className="bg-warm-50 rounded-xl p-3 space-y-2">
                        <p className="text-sm text-warm-700">Archive {med.name}? It will no longer appear in daily schedules, but all history is preserved.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowArchiveConfirm(null)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                          <button
                            onClick={async () => { await archiveMed.mutateAsync(med.id); setShowArchiveConfirm(null) }}
                            className="btn-danger flex-1 text-sm py-2">
                            Archive
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {stockModalMed && (
        <AddStockModal medicine={stockModalMed} onClose={() => setStockModalMed(null)} />
      )}
    </div>
  )
}
