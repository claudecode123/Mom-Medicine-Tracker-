import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { DoseRecord, TimePeriod } from '@/types/database'
import { compressImage } from '@/lib/utils'
import { format } from 'date-fns'
import { DEMO_MODE, DEMO_DOSES, DEMO_MEDICINES } from '@/lib/demo'

export function useTodayDoses() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['doses', 'today', user?.id, today],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_DOSES.map(d => ({
          ...d,
          medicines: DEMO_MEDICINES.find(m => m.id === d.medicine_id) ?? null,
        }))
      }
      const { data, error } = await (supabase as any)
        .from('dose_records')
        .select(`*, medicines(id, name, brand_name, strength, dosage_form, stock_unit, instructions, current_stock)`)
        .gte('scheduled_for', `${today}T00:00:00`)
        .lte('scheduled_for', `${today}T23:59:59`)
        .order('scheduled_for')
      if (error) throw error
      return data as Array<DoseRecord & { medicines: any }>
    },
    enabled: !!user,
    refetchInterval: DEMO_MODE ? false : 60_000,
  })
}

export function useDosesForDate(date: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['doses', 'date', user?.id, date],
    queryFn: async () => {
      if (DEMO_MODE) {
        const dayDoses = DEMO_DOSES.filter(d => d.scheduled_for.startsWith(date))
        return dayDoses.map(d => ({
          ...d,
          medicines: DEMO_MEDICINES.find(m => m.id === d.medicine_id) ?? null,
        }))
      }
      const { data, error } = await (supabase as any)
        .from('dose_records')
        .select(`*, medicines(id, name, brand_name, strength, dosage_form, stock_unit, instructions, current_stock)`)
        .gte('scheduled_for', `${date}T00:00:00`)
        .lte('scheduled_for', `${date}T23:59:59`)
        .order('scheduled_for')
      if (error) throw error
      return data as Array<DoseRecord & { medicines: any }>
    },
    enabled: !!user,
  })
}

export function useRecordDose() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      medicineId: string
      scheduleId: string | null
      scheduledPeriod: TimePeriod
      scheduledFor: string
      quantityAdministered: number
      photo: File | null
      notes: string | null
      brandUsed: string | null
    }) => {
      if (DEMO_MODE) {
        const idx = DEMO_DOSES.findIndex(
          d => d.medicine_id === payload.medicineId &&
               d.scheduled_period === payload.scheduledPeriod &&
               d.scheduled_for.startsWith(payload.scheduledFor.split('T')[0])
        )
        const doseUpdate = {
          status: 'given' as const,
          administered_at: new Date().toISOString(),
          quantity_administered: payload.quantityAdministered,
          notes: payload.notes,
          brand_used: payload.brandUsed,
          photo_storage_path: payload.photo ? 'demo-photo-path' : null,
        }
        if (idx !== -1) {
          Object.assign(DEMO_DOSES[idx], doseUpdate)
        } else {
          DEMO_DOSES.push({
            id: `dose-${Date.now()}`,
            medicine_id: payload.medicineId,
            schedule_id: payload.scheduleId,
            scheduled_period: payload.scheduledPeriod,
            scheduled_for: payload.scheduledFor,
            correction_reason: null,
            created_by: 'demo-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...doseUpdate,
          })
        }
        // deduct stock in demo mode
        const medIdx = DEMO_MEDICINES.findIndex(m => m.id === payload.medicineId)
        if (medIdx !== -1) DEMO_MEDICINES[medIdx].current_stock = Math.max(0, DEMO_MEDICINES[medIdx].current_stock - payload.quantityAdministered)
        return { dose_record_id: `dose-${Date.now()}`, new_stock: DEMO_MEDICINES[medIdx]?.current_stock }
      }

      let photoPath: string | null = null
      if (payload.photo) {
        const compressed = await compressImage(payload.photo)
        if (compressed.size > 5 * 1024 * 1024) throw new Error('Photo is too large (max 5 MB). Please try a smaller image.')
        const fileName = `${user!.id}/${payload.medicineId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('dose-photos')
          .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)
        photoPath = fileName
      }

      const { data, error } = await (supabase as any).rpc('record_dose_with_stock', {
        p_medicine_id: payload.medicineId,
        p_schedule_id: payload.scheduleId,
        p_scheduled_period: payload.scheduledPeriod,
        p_scheduled_for: payload.scheduledFor,
        p_quantity_administered: payload.quantityAdministered,
        p_photo_storage_path: photoPath,
        p_notes: payload.notes,
        p_user_id: user!.id,
        p_brand_used: payload.brandUsed,
      })
      if (error) {
        if (photoPath) await supabase.storage.from('dose-photos').remove([photoPath])
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doses'] })
      qc.invalidateQueries({ queryKey: ['medicines'] })
    },
  })
}

export function useSkipDose() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      medicineId: string
      scheduleId: string | null
      scheduledPeriod: TimePeriod
      scheduledFor: string
      reason: string | null
    }) => {
      if (DEMO_MODE) {
        const idx = DEMO_DOSES.findIndex(d => d.medicine_id === payload.medicineId && d.scheduled_period === payload.scheduledPeriod)
        if (idx !== -1) DEMO_DOSES[idx].status = 'skipped'
        return DEMO_DOSES[idx]
      }
      const { data, error } = await (supabase as any)
        .from('dose_records')
        .upsert({
          medicine_id: payload.medicineId,
          schedule_id: payload.scheduleId,
          scheduled_period: payload.scheduledPeriod,
          scheduled_for: payload.scheduledFor,
          status: 'skipped',
          notes: payload.reason,
          created_by: user!.id,
          quantity_administered: null,
          administered_at: null,
          photo_storage_path: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'medicine_id,scheduled_for,scheduled_period', ignoreDuplicates: false })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doses'] }),
  })
}

export function usePhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ['photo_url', path],
    queryFn: async () => {
      if (DEMO_MODE || !path) return null
      const { data, error } = await supabase.storage.from('dose-photos').createSignedUrl(path, 3600)
      if (error) return null
      return data.signedUrl
    },
    enabled: !!path && !DEMO_MODE,
    staleTime: 50 * 60 * 1000,
  })
}
