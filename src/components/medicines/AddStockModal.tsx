import { useState } from 'react'
import { X, Loader2, PackagePlus } from 'lucide-react'
import { useAddStock } from '@/hooks/useMedicines'
import type { Medicine } from '@/types/database'

interface Props {
  medicine: Medicine
  onClose: () => void
}

export function AddStockModal({ medicine, onClose }: Props) {
  const addStock = useAddStock()
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(qty)
    if (!amount || amount <= 0) { setError('Please enter a valid quantity.'); return }
    setError(null)
    try {
      await addStock.mutateAsync({ medicineId: medicine.id, quantity: amount, reason: reason.trim() || undefined })
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add stock.')
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-warm-800">Stock Added!</h3>
          <p className="text-warm-500 mt-1">+{qty} {medicine.stock_unit} added to {medicine.name}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-warm-100">
          <h2 className="font-bold text-warm-800 flex items-center gap-2"><PackagePlus size={18} /> Add Stock</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-warm-50 rounded-xl p-3">
            <p className="font-medium text-warm-800">{medicine.name}</p>
            <p className="text-sm text-warm-500">Current stock: {medicine.current_stock} {medicine.stock_unit}</p>
          </div>
          <div>
            <label className="label">Quantity to add</label>
            <div className="flex items-center gap-2">
              <input type="number" step="0.5" min="0.5" className="input-field flex-1"
                value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 30" required />
              <span className="text-warm-500 text-sm font-medium">{medicine.stock_unit}</span>
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input-field" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Bought on 29 Oct" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addStock.isPending} className="btn-primary flex-1">
              {addStock.isPending ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
