import type { Medicine, MedicineSchedule, DoseRecord, DoctorVisit, Profile, MedicineAlternativeBrand } from '@/types/database'
import { format, subDays } from 'date-fns'

export const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

export const DEMO_PROFILE: Profile = {
  id: 'demo-profile-id',
  user_id: 'demo-user-id',
  patient_name: 'Mom',
  caregiver_name: 'You',
  display_name: 'Demo User',
  role: 'user',
  email: null,
  relation: null,
  timezone: 'Asia/Kolkata',
  low_stock_threshold_days: 5,
  require_photo_for_dose: false,
  avatar_index: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// ─── Mom's actual medicine list ───────────────────────────────────────────────

const BASE = { owner_id: 'demo-user-id', dosage_form: 'tablet' as const, stock_unit: 'tablet', prescription_notes: null, refill_notes: null, stock_threshold_days: 5, active: true, archived_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), needs_confirmation: false, confirmation_notes: null, preferred_brand: null }

export const DEMO_MEDICINES: Medicine[] = [
  // ── Early Morning ───────────────────────────────
  {
    ...BASE, id: 'med-rcin', name: 'Rcin', brand_name: null, strength: '300 mg',
    instructions: 'Empty stomach', category: 'AKT', is_critical: true, current_stock: 60,
  },
  {
    ...BASE, id: 'med-panto', name: 'Pantakind', brand_name: null, strength: '40 mg',
    instructions: 'Empty stomach', category: null, is_critical: false,
    preferred_brand: null, current_stock: 30,
  },

  // ── Morning ─────────────────────────────────────
  {
    ...BASE, id: 'med-combutol', name: 'Combutol', brand_name: null, strength: '600 mg',
    instructions: 'After breakfast', category: 'AKT', is_critical: true, current_stock: 60,
  },
  {
    ...BASE, id: 'med-telma', name: 'Telma', brand_name: null, strength: '40 mg',
    instructions: 'After breakfast', category: 'BP', is_critical: true,
    preferred_brand: null, current_stock: 60,
  },
  {
    ...BASE, id: 'med-metxl', name: 'Met XL', brand_name: null, strength: '25 mg',
    instructions: 'After breakfast', category: 'BP', is_critical: true,
    preferred_brand: null, current_stock: 60,
  },
  {
    ...BASE, id: 'med-lacosam', name: 'Lacosam', brand_name: null, strength: '100 mg',
    instructions: 'After breakfast', category: 'Brain', is_critical: true,
    preferred_brand: null, needs_confirmation: true,
    confirmation_notes: 'Confirm strength/formulation of Lacoset before use. Lacosam 100 mg confirmed.',
    current_stock: 60,
  },
  {
    ...BASE, id: 'med-mmf', name: 'MMF', brand_name: null, strength: '500 mg',
    instructions: 'After breakfast', category: 'Immunosuppressant', is_critical: false, current_stock: 120,
  },

  // ── Afternoon ───────────────────────────────────
  {
    ...BASE, id: 'med-solonex', name: 'Solonex', brand_name: null, strength: '300 mg',
    instructions: null, category: 'AKT', is_critical: true, current_stock: 30,
  },
  {
    ...BASE, id: 'med-benadon', name: 'Benadon', brand_name: null, strength: '4 mg',
    instructions: null, category: 'AKT', is_critical: true,
    needs_confirmation: true,
    confirmation_notes: 'Supplied strength is 4 mg. Please confirm with prescribing doctor or pharmacist before use.',
    current_stock: 60,
  },

  // ── Evening / Night ─────────────────────────────
  // MMF, Met XL, Telma, Lacosam are already added above (shared medicines)
  {
    ...BASE, id: 'med-atrova', name: 'Atrova', brand_name: null, strength: '20 mg',
    instructions: null, category: 'Cholesterol / Heart', is_critical: true, current_stock: 30,
  },
  {
    ...BASE, id: 'med-fuberic', name: 'Fuberic', brand_name: null, strength: '40 mg',
    instructions: null, category: 'Uric Acid', is_critical: false, current_stock: 30,
  },
  {
    ...BASE, id: 'med-ecosprin', name: 'Ecosprin', brand_name: null, strength: '150 mg',
    instructions: null, category: 'Heart', is_critical: true, current_stock: 30,
  },
]

export const DEMO_ALTERNATIVE_BRANDS: MedicineAlternativeBrand[] = [
  // Pantakind group
  { id: 'brand-panto-1', medicine_id: 'med-panto', brand_name: 'Pantakind',  notes: null, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'brand-panto-2', medicine_id: 'med-panto', brand_name: 'Sompraz-D',  notes: null, sort_order: 2, created_at: new Date().toISOString() },
  { id: 'brand-panto-3', medicine_id: 'med-panto', brand_name: 'Esoogress',  notes: null, sort_order: 3, created_at: new Date().toISOString() },
  // Telma group
  { id: 'brand-telma-1', medicine_id: 'med-telma', brand_name: 'Telma 40',   notes: null, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'brand-telma-2', medicine_id: 'med-telma', brand_name: 'Cresar 40',  notes: null, sort_order: 2, created_at: new Date().toISOString() },
  // Met XL group
  { id: 'brand-metxl-1', medicine_id: 'med-metxl', brand_name: 'Met XL',       notes: null, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'brand-metxl-2', medicine_id: 'med-metxl', brand_name: 'Promolet XL',  notes: null, sort_order: 2, created_at: new Date().toISOString() },
  // Lacosam group
  { id: 'brand-lac-1', medicine_id: 'med-lacosam', brand_name: 'Lacosam 100', notes: null, sort_order: 1, created_at: new Date().toISOString() },
  { id: 'brand-lac-2', medicine_id: 'med-lacosam', brand_name: 'Lacoset', notes: 'Strength not confirmed — verify with pharmacist', sort_order: 2, created_at: new Date().toISOString() },
]

export const DEMO_SCHEDULES: MedicineSchedule[] = [
  // Early morning
  { id: 'sch-rcin',     medicine_id: 'med-rcin',     time_period: 'early_morning', quantity_per_dose: 2, scheduled_time: null, applicable_days: null, active: true, sort_order: 1,  created_at: new Date().toISOString() },
  { id: 'sch-panto',    medicine_id: 'med-panto',    time_period: 'early_morning', quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 2,  created_at: new Date().toISOString() },
  // Morning
  { id: 'sch-combutol', medicine_id: 'med-combutol', time_period: 'morning',       quantity_per_dose: 2, scheduled_time: null, applicable_days: null, active: true, sort_order: 1,  created_at: new Date().toISOString() },
  { id: 'sch-telma-m',  medicine_id: 'med-telma',    time_period: 'morning',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 2,  created_at: new Date().toISOString() },
  { id: 'sch-metxl-m',  medicine_id: 'med-metxl',    time_period: 'morning',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 3,  created_at: new Date().toISOString() },
  { id: 'sch-lac-m',    medicine_id: 'med-lacosam',  time_period: 'morning',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 4,  created_at: new Date().toISOString() },
  { id: 'sch-mmf-m',    medicine_id: 'med-mmf',      time_period: 'morning',       quantity_per_dose: 2, scheduled_time: null, applicable_days: null, active: true, sort_order: 5,  created_at: new Date().toISOString() },
  // Afternoon
  { id: 'sch-solonex',  medicine_id: 'med-solonex',  time_period: 'afternoon',     quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 1,  created_at: new Date().toISOString() },
  { id: 'sch-benadon',  medicine_id: 'med-benadon',  time_period: 'afternoon',     quantity_per_dose: 2, scheduled_time: null, applicable_days: null, active: true, sort_order: 2,  created_at: new Date().toISOString() },
  // Evening / Night
  { id: 'sch-mmf-e',    medicine_id: 'med-mmf',      time_period: 'evening',       quantity_per_dose: 2, scheduled_time: null, applicable_days: null, active: true, sort_order: 1,  created_at: new Date().toISOString() },
  { id: 'sch-metxl-e',  medicine_id: 'med-metxl',    time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 2,  created_at: new Date().toISOString() },
  { id: 'sch-atrova',   medicine_id: 'med-atrova',   time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 3,  created_at: new Date().toISOString() },
  { id: 'sch-lac-e',    medicine_id: 'med-lacosam',  time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 4,  created_at: new Date().toISOString() },
  { id: 'sch-fuberic',  medicine_id: 'med-fuberic',  time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 5,  created_at: new Date().toISOString() },
  { id: 'sch-ecosprin', medicine_id: 'med-ecosprin', time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 6,  created_at: new Date().toISOString() },
  { id: 'sch-telma-e',  medicine_id: 'med-telma',    time_period: 'evening',       quantity_per_dose: 1, scheduled_time: null, applicable_days: null, active: true, sort_order: 7,  created_at: new Date().toISOString() },
]

const today = format(new Date(), 'yyyy-MM-dd')

export const DEMO_DOSES: DoseRecord[] = [
  // Generate pending doses for today's schedules
  ...DEMO_SCHEDULES.map((s, i) => ({
    id: `dose-${i}`,
    medicine_id: s.medicine_id,
    schedule_id: s.id,
    scheduled_period: s.time_period,
    scheduled_for: `${today}T${
      s.time_period === 'early_morning' ? '06:00:00' :
      s.time_period === 'morning'       ? '08:00:00' :
      s.time_period === 'afternoon'     ? '13:00:00' : '20:00:00'
    }`,
    administered_at: null,
    quantity_administered: null,
    status: 'pending' as const,
    photo_storage_path: null,
    notes: null,
    brand_used: null,
    correction_reason: null,
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
]

export const DEMO_VISITS: DoctorVisit[] = [
  {
    id: 'visit-1',
    owner_id: 'demo-user-id',
    doctor_name: 'Dr. Priya Sharma',
    clinic_name: 'Apollo Clinic',
    visit_date: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    reason: 'Routine check-up',
    visit_summary: 'All medicines continuing. BP under control. AKT course on schedule.',
    follow_up_date: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
    prescription_notes: 'Continue all current medications.',
    attachment_storage_path: null,
    notes_for_next: 'Bring last 2 weeks of BP readings',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
