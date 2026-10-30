import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { DoctorVisit } from '@/types/database'
import { compressImage } from '@/lib/utils'
import { DEMO_MODE, DEMO_VISITS } from '@/lib/demo'

export function useDoctorVisits() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['doctor_visits', user?.id],
    queryFn: async () => {
      if (DEMO_MODE) return [...DEMO_VISITS].sort((a, b) => b.visit_date.localeCompare(a.visit_date))
      const { data, error } = await (supabase as any)
        .from('doctor_visits')
        .select('*')
        .eq('owner_id', user!.id)
        .order('visit_date', { ascending: false })
      if (error) throw error
      return data as DoctorVisit[]
    },
    enabled: !!user,
  })
}

export function useUpcomingFollowUp() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['follow_up', user?.id, today],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_VISITS.find(v => v.follow_up_date && v.follow_up_date >= today) as DoctorVisit | undefined
      }
      const { data, error } = await (supabase as any)
        .from('doctor_visits')
        .select('*')
        .eq('owner_id', user!.id)
        .gte('follow_up_date', today)
        .order('follow_up_date')
        .limit(1)
      if (error) throw error
      return data?.[0] as DoctorVisit | undefined
    },
    enabled: !!user,
  })
}

export function useCreateVisit() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      visit: Omit<DoctorVisit, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'attachment_storage_path'>
      attachment: File | null
    }) => {
      if (DEMO_MODE) {
        const newVisit: DoctorVisit = {
          ...payload.visit,
          id: `visit-${Date.now()}`,
          owner_id: 'demo-user-id',
          attachment_storage_path: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        DEMO_VISITS.push(newVisit)
        return newVisit
      }
      let attachmentPath: string | null = null
      if (payload.attachment) {
        const compressed = await compressImage(payload.attachment, 1600, 0.8)
        const fileName = `${user!.id}/visits/${Date.now()}.jpg`
        const { error } = await supabase.storage.from('dose-photos').upload(fileName, compressed, { contentType: 'image/jpeg' })
        if (error) throw new Error(`Attachment upload failed: ${error.message}`)
        attachmentPath = fileName
      }
      const { data, error } = await (supabase as any).from('doctor_visits').insert({
        ...payload.visit, owner_id: user!.id, attachment_storage_path: attachmentPath,
      }).select().single()
      if (error) throw error
      return data as DoctorVisit
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor_visits'] }),
  })
}

export function useUpdateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DoctorVisit> }) => {
      if (DEMO_MODE) {
        const idx = DEMO_VISITS.findIndex(v => v.id === id)
        if (idx !== -1) Object.assign(DEMO_VISITS[idx], updates)
        return DEMO_VISITS[idx]
      }
      const { data, error } = await (supabase as any)
        .from('doctor_visits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return data as DoctorVisit
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor_visits'] }),
  })
}

export function useDeleteVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const idx = DEMO_VISITS.findIndex(v => v.id === id)
        if (idx !== -1) DEMO_VISITS.splice(idx, 1)
        return
      }
      const { error } = await (supabase as any).from('doctor_visits').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor_visits'] }),
  })
}
