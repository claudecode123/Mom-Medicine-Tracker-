import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Medicine, MedicineSchedule } from '@/types/database'
import { DEMO_MODE, DEMO_MEDICINES, DEMO_SCHEDULES } from '@/lib/demo'

export function useMedicines(includeArchived = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['medicines', user?.id, includeArchived],
    queryFn: async () => {
      if (DEMO_MODE) {
        const meds = DEMO_MEDICINES.filter(m => includeArchived || !m.archived_at)
        return meds.map(m => ({
          ...m,
          medicine_schedules: DEMO_SCHEDULES.filter(s => s.medicine_id === m.id),
        })) as (Medicine & { medicine_schedules: MedicineSchedule[] })[]
      }
      let q = (supabase as any)
        .from('medicines')
        .select('*, medicine_schedules(*)')
        .eq('owner_id', user!.id)
        .order('name')
        .order('sort_order', { referencedTable: 'medicine_schedules', ascending: true })
      if (!includeArchived) q = q.is('archived_at', null)
      const { data, error } = await q
      if (error) throw error
      return data as (Medicine & { medicine_schedules: MedicineSchedule[] })[]
    },
    enabled: !!user,
  })
}

export function useMedicine(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['medicine', id],
    queryFn: async () => {
      if (DEMO_MODE) {
        const med = DEMO_MEDICINES.find(m => m.id === id)
        const schedules = DEMO_SCHEDULES.filter(s => s.medicine_id === id)
        return { ...med, medicine_schedules: schedules } as Medicine & { medicine_schedules: MedicineSchedule[] }
      }
      const { data, error } = await (supabase as any)
        .from('medicines')
        .select('*, medicine_schedules(*)')
        .eq('id', id)
        .eq('owner_id', user!.id)
        .single()
      if (error) throw error
      return data as Medicine & { medicine_schedules: MedicineSchedule[] }
    },
    enabled: !!user && !!id,
  })
}

export function useCreateMedicine() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'owner_id'>
      schedules: Array<Omit<MedicineSchedule, 'id' | 'created_at' | 'medicine_id'>>
    }) => {
      if (DEMO_MODE) {
        const newMed: Medicine = {
          ...payload.medicine,
          id: `med-${Date.now()}`,
          owner_id: 'demo-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        DEMO_MEDICINES.push(newMed)
        return newMed
      }
      const { data: med, error: medError } = await (supabase as any)
        .from('medicines')
        .insert({ ...payload.medicine, owner_id: user!.id })
        .select()
        .single()
      if (medError) throw medError
      if (payload.schedules.length > 0) {
        const { error: schedError } = await (supabase as any)
          .from('medicine_schedules')
          .insert(payload.schedules.map((s: any) => ({ ...s, medicine_id: med.id })))
        if (schedError) throw schedError
      }
      return med as Medicine
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicines'] }),
  })
}

export function useUpdateMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Medicine> }) => {
      if (DEMO_MODE) {
        const idx = DEMO_MEDICINES.findIndex(m => m.id === id)
        if (idx !== -1) Object.assign(DEMO_MEDICINES[idx], updates)
        return DEMO_MEDICINES[idx]
      }
      const { data, error } = await (supabase as any)
        .from('medicines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Medicine
    },
    onSuccess: (_: any, vars: { id: string; updates: Partial<Medicine> }) => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['medicine', vars.id] })
    },
  })
}

export function useArchiveMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const idx = DEMO_MEDICINES.findIndex(m => m.id === id)
        if (idx !== -1) { DEMO_MEDICINES[idx].archived_at = new Date().toISOString(); DEMO_MEDICINES[idx].active = false }
        return
      }
      const { error } = await (supabase as any)
        .from('medicines')
        .update({ archived_at: new Date().toISOString(), active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicines'] }),
  })
}

export function useAddStock() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ medicineId, quantity, reason }: { medicineId: string; quantity: number; reason?: string }) => {
      if (DEMO_MODE) {
        const idx = DEMO_MEDICINES.findIndex(m => m.id === medicineId)
        if (idx !== -1) DEMO_MEDICINES[idx].current_stock += quantity
        return { new_stock: DEMO_MEDICINES[idx]?.current_stock }
      }
      const { data, error } = await (supabase as any).rpc('add_stock', {
        p_medicine_id: medicineId,
        p_quantity: quantity,
        p_reason: reason ?? null,
        p_user_id: user!.id,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['stock_transactions'] })
    },
  })
}

export function useCorrectStock() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ medicineId, quantityChange, reason }: { medicineId: string; quantityChange: number; reason: string }) => {
      if (DEMO_MODE) {
        const idx = DEMO_MEDICINES.findIndex(m => m.id === medicineId)
        if (idx !== -1) DEMO_MEDICINES[idx].current_stock = Math.max(0, DEMO_MEDICINES[idx].current_stock + quantityChange)
        return { new_stock: DEMO_MEDICINES[idx]?.current_stock }
      }
      const { data, error } = await (supabase as any).rpc('correct_stock', {
        p_medicine_id: medicineId,
        p_quantity_change: quantityChange,
        p_reason: reason,
        p_user_id: user!.id,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['stock_transactions'] })
    },
  })
}

export function useSchedules(medicineId: string) {
  return useQuery({
    queryKey: ['schedules', medicineId],
    queryFn: async () => {
      if (DEMO_MODE) return DEMO_SCHEDULES.filter(s => s.medicine_id === medicineId)
      const { data, error } = await (supabase as any)
        .from('medicine_schedules')
        .select('*')
        .eq('medicine_id', medicineId)
        .eq('active', true)
        .order('time_period')
      if (error) throw error
      return data as MedicineSchedule[]
    },
    enabled: !!medicineId,
  })
}

export function useSaveSchedules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ medicineId, schedules }: {
      medicineId: string
      schedules: Array<Omit<MedicineSchedule, 'id' | 'created_at' | 'medicine_id'>>
    }) => {
      if (DEMO_MODE) {
        const toRemove = DEMO_SCHEDULES.filter(s => s.medicine_id === medicineId)
        toRemove.forEach(s => { const i = DEMO_SCHEDULES.indexOf(s); if (i > -1) DEMO_SCHEDULES.splice(i, 1) })
        schedules.forEach(s => DEMO_SCHEDULES.push({ ...s, id: `sch-${Date.now()}-${Math.random()}`, medicine_id: medicineId, created_at: new Date().toISOString() }))
        return
      }
      await (supabase as any).from('medicine_schedules').delete().eq('medicine_id', medicineId)
      if (schedules.length > 0) {
        const { error } = await (supabase as any)
          .from('medicine_schedules')
          .insert(schedules.map(s => ({ ...s, medicine_id: medicineId })))
        if (error) throw error
      }
    },
    onSuccess: (_: any, vars: { medicineId: string; schedules: any[] }) => {
      qc.invalidateQueries({ queryKey: ['schedules', vars.medicineId] })
      qc.invalidateQueries({ queryKey: ['medicine', vars.medicineId] })
    },
  })
}

export function useStockTransactions(medicineId: string) {
  return useQuery({
    queryKey: ['stock_transactions', medicineId],
    queryFn: async () => {
      if (DEMO_MODE) return []
      const { data, error } = await (supabase as any)
        .from('stock_transactions')
        .select('*')
        .eq('medicine_id', medicineId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: !!medicineId,
  })
}
