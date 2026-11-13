import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { compressImage } from '@/lib/utils'
import type { TimePeriod } from '@/types/database'

export function usePeriodPhoto(date: string, period: TimePeriod) {
  return useQuery({
    queryKey: ['period_photo', date, period],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('period_photos')
        .select('*')
        .eq('dose_date', date)
        .eq('period', period)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { id: string; photo_storage_path: string; notes: string | null } | null
    },
    staleTime: 60_000,
  })
}

export function usePeriodPhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ['period_photo_url', path],
    queryFn: async () => {
      if (!path) return null
      const { data, error } = await supabase.storage
        .from('dose-photos')
        .createSignedUrl(path, 3600)
      if (error) return null
      return data.signedUrl
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  })
}

export function useUploadPeriodPhoto() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      date: string
      period: TimePeriod
      photo: File
      notes?: string
      existingId?: string
    }) => {
      const compressed = await compressImage(payload.photo)
      if (compressed.size > 5 * 1024 * 1024) throw new Error('Photo is too large (max 5 MB).')
      const fileName = `${user!.id}/period/${payload.date}/${payload.period}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('dose-photos')
        .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

      if (payload.existingId) {
        const { error } = await (supabase as any)
          .from('period_photos')
          .update({
            photo_storage_path: fileName,
            notes: payload.notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.existingId)
        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from('period_photos')
          .insert({
            owner_id: user!.id,
            dose_date: payload.date,
            period: payload.period,
            photo_storage_path: fileName,
            notes: payload.notes ?? null,
            created_by: user!.id,
          })
        if (error) throw error
      }
      return fileName
    },
    onSuccess: (_: any, vars: { date: string; period: TimePeriod; photo: File; notes?: string; existingId?: string }) => {
      qc.invalidateQueries({ queryKey: ['period_photo', vars.date, vars.period] })
    },
  })
}

export function useDeletePeriodPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; date: string; period: TimePeriod; path: string }) => {
      await supabase.storage.from('dose-photos').remove([payload.path])
      const { error } = await (supabase as any)
        .from('period_photos')
        .delete()
        .eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: (_: any, vars: { id: string; date: string; period: TimePeriod; path: string }) => {
      qc.invalidateQueries({ queryKey: ['period_photo', vars.date, vars.period] })
    },
  })
}
