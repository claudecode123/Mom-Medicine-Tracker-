import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MedicineAlternativeBrand } from '@/types/database'
import { DEMO_MODE, DEMO_ALTERNATIVE_BRANDS, DEMO_MEDICINES } from '@/lib/demo'

export function useAlternativeBrands(medicineId: string) {
  return useQuery({
    queryKey: ['alt_brands', medicineId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_ALTERNATIVE_BRANDS.filter(b => b.medicine_id === medicineId)
          .sort((a, b) => a.sort_order - b.sort_order)
      }
      const { data, error } = await (supabase as any)
        .from('medicine_alternative_brands')
        .select('*')
        .eq('medicine_id', medicineId)
        .order('sort_order')
      if (error) throw error
      return data as MedicineAlternativeBrand[]
    },
    enabled: !!medicineId,
  })
}

export function useAddAlternativeBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { medicineId: string; brandName: string; notes?: string }) => {
      const { medicineId, brandName, notes } = vars
      if (DEMO_MODE) {
        const existing = DEMO_ALTERNATIVE_BRANDS.filter(b => b.medicine_id === medicineId)
        const newBrand: MedicineAlternativeBrand = {
          id: `brand-${Date.now()}`,
          medicine_id: medicineId,
          brand_name: brandName,
          notes: notes ?? null,
          sort_order: existing.length + 1,
          created_at: new Date().toISOString(),
        }
        DEMO_ALTERNATIVE_BRANDS.push(newBrand)
        return newBrand
      }
      const existing = await (supabase as any)
        .from('medicine_alternative_brands')
        .select('id')
        .eq('medicine_id', medicineId)
      const sortOrder = (existing.data?.length ?? 0) + 1
      const { data, error } = await (supabase as any)
        .from('medicine_alternative_brands')
        .insert({ medicine_id: medicineId, brand_name: brandName, notes: notes ?? null, sort_order: sortOrder })
        .select().single()
      if (error) throw error
      return data as MedicineAlternativeBrand
    },
    onSuccess: (_: any, vars: { medicineId: string; brandName: string; notes?: string }) => {
      qc.invalidateQueries({ queryKey: ['alt_brands', vars.medicineId] })
    },
  })
}

export function useDeleteAlternativeBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, medicineId }: { id: string; medicineId: string }) => {
      if (DEMO_MODE) {
        const idx = DEMO_ALTERNATIVE_BRANDS.findIndex(b => b.id === id)
        if (idx !== -1) DEMO_ALTERNATIVE_BRANDS.splice(idx, 1)
        return
      }
      const { error } = await (supabase as any)
        .from('medicine_alternative_brands')
        .delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_: any, vars: { id: string; medicineId: string }) => {
      qc.invalidateQueries({ queryKey: ['alt_brands', vars.medicineId] })
    },
  })
}

export function useSetPreferredBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { medicineId: string; brand: string | null }) => {
      const { medicineId, brand } = vars
      if (DEMO_MODE) {
        const idx = DEMO_MEDICINES.findIndex(m => m.id === medicineId)
        if (idx !== -1) (DEMO_MEDICINES[idx] as any).preferred_brand = brand
        return
      }
      const { error } = await (supabase as any)
        .from('medicines')
        .update({ preferred_brand: brand, updated_at: new Date().toISOString() })
        .eq('id', medicineId)
      if (error) throw error
    },
    onSuccess: (_: any, vars: { medicineId: string; brand: string | null }) => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['medicine', vars.medicineId] })
    },
  })
}
