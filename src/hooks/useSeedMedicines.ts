import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { DEMO_MODE } from '@/lib/demo'

export function useSeedMedicines() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (DEMO_MODE) {
        // In demo mode, data is already pre-loaded in demo.ts
        return
      }
      const { error } = await (supabase as any).rpc('seed_moms_medicines', {
        p_user_id: user!.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['doses'] })
    },
  })
}
