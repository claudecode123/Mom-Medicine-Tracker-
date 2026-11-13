export type TimePeriod = 'early_morning' | 'morning' | 'afternoon' | 'evening'
export type DoseStatus = 'pending' | 'given' | 'skipped' | 'overdue'
export type StockTransactionType = 'dose_deduction' | 'stock_addition' | 'manual_correction' | 'dose_reversal'
export type DosageForm = 'tablet' | 'capsule' | 'syrup' | 'drops' | 'injection' | 'cream' | 'other'

export interface Profile {
  id: string
  user_id: string
  patient_name: string
  caregiver_name: string | null
  display_name: string | null
  role: 'admin' | 'user'
  timezone: string
  low_stock_threshold_days: number
  require_photo_for_dose: boolean
  created_at: string
  updated_at: string
}

export interface PeriodPhoto {
  id: string
  owner_id: string
  dose_date: string
  period: TimePeriod
  photo_storage_path: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Medicine {
  id: string
  owner_id: string
  name: string
  brand_name: string | null
  strength: string | null
  dosage_form: DosageForm
  stock_unit: string
  instructions: string | null
  prescription_notes: string | null
  refill_notes: string | null
  current_stock: number
  stock_threshold_days: number
  active: boolean
  archived_at: string | null
  // new in migration 003
  category: string | null
  is_critical: boolean
  needs_confirmation: boolean
  confirmation_notes: string | null
  preferred_brand: string | null
  created_at: string
  updated_at: string
}

export interface MedicineAlternativeBrand {
  id: string
  medicine_id: string
  brand_name: string
  notes: string | null
  sort_order: number
  created_at: string
}

export interface MedicineSchedule {
  id: string
  medicine_id: string
  time_period: TimePeriod
  scheduled_time: string | null
  quantity_per_dose: number
  applicable_days: string[] | null
  active: boolean
  sort_order?: number
  created_at: string
}

export interface DoseRecord {
  id: string
  medicine_id: string
  schedule_id: string | null
  scheduled_period: TimePeriod
  scheduled_for: string
  administered_at: string | null
  quantity_administered: number | null
  status: DoseStatus
  photo_storage_path: string | null
  notes: string | null
  brand_used: string | null   // new in migration 003
  correction_reason: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface StockTransaction {
  id: string
  medicine_id: string
  dose_record_id: string | null
  transaction_type: StockTransactionType
  quantity_change: number
  balance_after: number
  reason: string | null
  created_by: string
  created_at: string
}

export interface DoctorVisit {
  id: string
  owner_id: string
  doctor_name: string
  clinic_name: string | null
  visit_date: string
  reason: string | null
  visit_summary: string | null
  follow_up_date: string | null
  prescription_notes: string | null
  attachment_storage_path: string | null
  notes_for_next: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      medicines: {
        Row: Medicine
        Insert: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Medicine, 'id'>>
      }
      medicine_alternative_brands: {
        Row: MedicineAlternativeBrand
        Insert: Omit<MedicineAlternativeBrand, 'id' | 'created_at'>
        Update: Partial<Omit<MedicineAlternativeBrand, 'id'>>
      }
      medicine_schedules: {
        Row: MedicineSchedule
        Insert: Omit<MedicineSchedule, 'id' | 'created_at'>
        Update: Partial<Omit<MedicineSchedule, 'id'>>
      }
      dose_records: {
        Row: DoseRecord
        Insert: Omit<DoseRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DoseRecord, 'id'>>
      }
      stock_transactions: {
        Row: StockTransaction
        Insert: Omit<StockTransaction, 'id' | 'created_at'>
        Update: never
      }
      doctor_visits: {
        Row: DoctorVisit
        Insert: Omit<DoctorVisit, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DoctorVisit, 'id'>>
      }
    }
    Functions: {
      record_dose_with_stock: {
        Args: {
          p_medicine_id: string
          p_schedule_id: string | null
          p_scheduled_period: TimePeriod
          p_scheduled_for: string
          p_quantity_administered: number
          p_photo_storage_path: string | null
          p_notes: string | null
          p_user_id: string
          p_brand_used: string | null
        }
        Returns: { dose_record_id: string; new_stock: number }
      }
      add_stock: {
        Args: {
          p_medicine_id: string
          p_quantity: number
          p_reason: string | null
          p_user_id: string
        }
        Returns: { new_stock: number }
      }
      correct_stock: {
        Args: {
          p_medicine_id: string
          p_quantity_change: number
          p_reason: string
          p_user_id: string
        }
        Returns: { new_stock: number }
      }
      seed_moms_medicines: {
        Args: { p_user_id: string }
        Returns: void
      }
    }
  }
}
