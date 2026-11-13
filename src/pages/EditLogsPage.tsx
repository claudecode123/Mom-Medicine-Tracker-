import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ScrollText, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export function EditLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['edit-logs'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('dose_edit_logs')
        .select('*')
        .order('edited_at', { ascending: false })
      return data ?? []
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <ScrollText size={20} className="text-amber-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-warm-800">Edit Logs</h1>
          <p className="text-xs text-warm-400">All past-dose edits · visible to everyone · cannot be deleted</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-10">
          <ScrollText size={32} className="text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500 font-medium">No edits logged yet</p>
          <p className="text-xs text-warm-400 mt-1">When an admin edits a past dose, it will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="card space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-warm-800 text-sm">{log.medicine_name}</p>
                  {log.medicine_strength && (
                    <p className="text-xs text-warm-400">{log.medicine_strength}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  log.action === 'given'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-warm-100 text-warm-600'
                }`}>
                  {log.action}
                </span>
              </div>

              <div className="text-xs text-warm-600 space-y-1">
                <p>
                  <span className="text-warm-400">Date · Period: </span>
                  {log.dose_date} · {log.period.replace(/_/g, ' ')}
                </p>
                {log.quantity != null && (
                  <p><span className="text-warm-400">Qty: </span>{log.quantity}</p>
                )}
                {log.correction_reason && (
                  <p><span className="text-warm-400">Reason: </span>{log.correction_reason}</p>
                )}
                {log.notes && (
                  <p><span className="text-warm-400">Notes: </span>{log.notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-warm-100">
                <p className="text-xs font-medium text-warm-500">
                  {log.edited_by_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-warm-400">
                  {format(parseISO(log.edited_at), 'dd MMM yyyy, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
