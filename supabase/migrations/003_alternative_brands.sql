-- ============================================================
-- Migration 003: Alternative brands + category + critical flags
-- Safe to re-run (all statements use IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ────────────────────────────────────────────────
-- 1. Add new columns to medicines
-- ────────────────────────────────────────────────
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS category          text,
  ADD COLUMN IF NOT EXISTS is_critical       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_confirmation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_notes text,
  ADD COLUMN IF NOT EXISTS preferred_brand   text;

-- ────────────────────────────────────────────────
-- 2. Alternative brands table
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medicine_alternative_brands (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id  uuid        NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  brand_name   text        NOT NULL,
  notes        text,
  sort_order   int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medicine_id, brand_name)
);

CREATE INDEX IF NOT EXISTS alt_brands_medicine_idx
  ON public.medicine_alternative_brands(medicine_id);

-- RLS
ALTER TABLE public.medicine_alternative_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their medicine brands" ON public.medicine_alternative_brands;
CREATE POLICY "Users manage their medicine brands"
  ON public.medicine_alternative_brands
  USING  (EXISTS (SELECT 1 FROM public.medicines WHERE id = medicine_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.medicines WHERE id = medicine_id AND owner_id = auth.uid()));

-- ────────────────────────────────────────────────
-- 3. Add brand_used to dose_records
-- ────────────────────────────────────────────────
ALTER TABLE public.dose_records
  ADD COLUMN IF NOT EXISTS brand_used text;

-- ────────────────────────────────────────────────
-- 4. Update atomic dose function to accept brand_used
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_dose_with_stock(
  p_medicine_id            uuid,
  p_schedule_id            uuid,
  p_scheduled_period       text,
  p_scheduled_for          timestamptz,
  p_quantity_administered  numeric,
  p_photo_storage_path     text,
  p_notes                  text,
  p_user_id                uuid,
  p_brand_used             text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_medicine    medicines%rowtype;
  v_new_stock   numeric;
  v_dose_id     uuid;
  v_existing_id uuid;
BEGIN
  -- Lock the medicine row
  SELECT * INTO v_medicine FROM medicines WHERE id = p_medicine_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicine not found';
  END IF;

  -- Idempotency: if already given for this slot, return existing
  SELECT id INTO v_existing_id
  FROM dose_records
  WHERE medicine_id      = p_medicine_id
    AND scheduled_period = p_scheduled_period
    AND scheduled_for::date = p_scheduled_for::date
    AND status           = 'given';

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('dose_record_id', v_existing_id, 'new_stock', v_medicine.current_stock);
  END IF;

  -- Check stock
  IF v_medicine.current_stock < p_quantity_administered THEN
    RAISE EXCEPTION 'Insufficient stock: % available, % requested',
      v_medicine.current_stock, p_quantity_administered;
  END IF;

  -- Deduct stock
  v_new_stock := v_medicine.current_stock - p_quantity_administered;
  UPDATE medicines SET current_stock = v_new_stock, updated_at = now() WHERE id = p_medicine_id;

  -- Upsert dose record
  INSERT INTO dose_records (
    medicine_id, schedule_id, scheduled_period, scheduled_for,
    administered_at, quantity_administered, status,
    photo_storage_path, notes, brand_used, created_by, updated_at
  ) VALUES (
    p_medicine_id, p_schedule_id, p_scheduled_period, p_scheduled_for,
    now(), p_quantity_administered, 'given',
    p_photo_storage_path, p_notes, p_brand_used, p_user_id, now()
  )
  ON CONFLICT (medicine_id, scheduled_period, scheduled_for)
  DO UPDATE SET
    administered_at       = EXCLUDED.administered_at,
    quantity_administered = EXCLUDED.quantity_administered,
    status                = EXCLUDED.status,
    photo_storage_path    = EXCLUDED.photo_storage_path,
    notes                 = EXCLUDED.notes,
    brand_used            = EXCLUDED.brand_used,
    updated_at            = now()
  RETURNING id INTO v_dose_id;

  -- Record stock transaction
  INSERT INTO stock_transactions (
    medicine_id, dose_record_id, transaction_type,
    quantity_change, balance_after, reason, created_by
  ) VALUES (
    p_medicine_id, v_dose_id, 'dose_deduction',
    -p_quantity_administered, v_new_stock,
    COALESCE('Dose recorded – brand: ' || p_brand_used, 'Dose recorded'),
    p_user_id
  );

  RETURN jsonb_build_object('dose_record_id', v_dose_id, 'new_stock', v_new_stock);
END;
$$;

-- ────────────────────────────────────────────────
-- 5. Seed function: inserts mom's medicine list for a given user
--    Safe to call multiple times (ON CONFLICT DO NOTHING on name+strength+owner)
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_moms_medicines(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rcin          uuid;
  v_panto         uuid;
  v_combutol      uuid;
  v_telma         uuid;
  v_metxl         uuid;
  v_lacosam       uuid;
  v_mmf           uuid;
  v_solonex       uuid;
  v_benadon       uuid;
  v_atrova        uuid;
  v_fuberic       uuid;
  v_ecosprin      uuid;
BEGIN

  -- ── Early Morning ─────────────────────────────
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, is_critical, current_stock)
  VALUES (p_user_id, 'Rcin', '300 mg', 'tablet', 'tablet', 'Empty stomach',
    'AKT', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rcin;

  IF v_rcin IS NULL THEN
    SELECT id INTO v_rcin FROM medicines WHERE owner_id = p_user_id AND name = 'Rcin' AND strength = '300 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_rcin, 'early_morning', 2) ON CONFLICT DO NOTHING;

  -- Pantakind group (no fixed generic name – first brand is the primary)
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    preferred_brand, current_stock)
  VALUES (p_user_id, 'Pantakind', '40 mg', 'tablet', 'tablet', 'Empty stomach',
    NULL, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_panto;

  IF v_panto IS NULL THEN
    SELECT id INTO v_panto FROM medicines WHERE owner_id = p_user_id AND name = 'Pantakind' AND strength = '40 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_panto, 'early_morning', 1) ON CONFLICT DO NOTHING;

  INSERT INTO medicine_alternative_brands (medicine_id, brand_name, sort_order)
  VALUES (v_panto, 'Pantakind', 1),
         (v_panto, 'Sompraz-D',  2),
         (v_panto, 'Esoogress',  3)
  ON CONFLICT DO NOTHING;

  -- ── Morning ───────────────────────────────────
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, is_critical, current_stock)
  VALUES (p_user_id, 'Combutol', '600 mg', 'tablet', 'tablet', 'After breakfast',
    'AKT', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_combutol;

  IF v_combutol IS NULL THEN
    SELECT id INTO v_combutol FROM medicines WHERE owner_id = p_user_id AND name = 'Combutol' AND strength = '600 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_combutol, 'morning', 2) ON CONFLICT DO NOTHING;

  -- Telma/Cresar group (shared morning + evening)
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, is_critical, preferred_brand, current_stock)
  VALUES (p_user_id, 'Telma', '40 mg', 'tablet', 'tablet', 'After breakfast',
    'BP', true, NULL, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_telma;

  IF v_telma IS NULL THEN
    SELECT id INTO v_telma FROM medicines WHERE owner_id = p_user_id AND name = 'Telma' AND strength = '40 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_telma, 'morning', 1), (v_telma, 'evening', 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO medicine_alternative_brands (medicine_id, brand_name, sort_order)
  VALUES (v_telma, 'Telma 40',  1),
         (v_telma, 'Cresar 40', 2)
  ON CONFLICT DO NOTHING;

  -- Met XL/Promolet group (morning + evening)
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, is_critical, preferred_brand, current_stock)
  VALUES (p_user_id, 'Met XL', '25 mg', 'tablet', 'tablet', 'After breakfast',
    'BP', true, NULL, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_metxl;

  IF v_metxl IS NULL THEN
    SELECT id INTO v_metxl FROM medicines WHERE owner_id = p_user_id AND name = 'Met XL' AND strength = '25 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_metxl, 'morning', 1), (v_metxl, 'evening', 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO medicine_alternative_brands (medicine_id, brand_name, sort_order)
  VALUES (v_metxl, 'Met XL',      1),
         (v_metxl, 'Promolet XL', 2)
  ON CONFLICT DO NOTHING;

  -- Lacosam/Lacoset group (morning + evening) — Lacoset strength unconfirmed
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, is_critical, preferred_brand, needs_confirmation, confirmation_notes, current_stock)
  VALUES (p_user_id, 'Lacosam', '100 mg', 'tablet', 'tablet', 'After breakfast',
    'Brain', true, NULL, true,
    'Confirm strength/formulation of Lacoset before use. Lacosam 100 mg confirmed.',
    0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lacosam;

  IF v_lacosam IS NULL THEN
    SELECT id INTO v_lacosam FROM medicines WHERE owner_id = p_user_id AND name = 'Lacosam' AND strength = '100 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_lacosam, 'morning', 1), (v_lacosam, 'evening', 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO medicine_alternative_brands (medicine_id, brand_name, sort_order, notes)
  VALUES (v_lacosam, 'Lacosam 100', 1, NULL),
         (v_lacosam, 'Lacoset',     2, 'Strength not yet confirmed — verify with pharmacist before use')
  ON CONFLICT DO NOTHING;

  -- MMF (morning + evening, shared stock)
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit, instructions,
    category, current_stock)
  VALUES (p_user_id, 'MMF', '500 mg', 'tablet', 'tablet', 'After breakfast',
    'Immunosuppressant', 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_mmf;

  IF v_mmf IS NULL THEN
    SELECT id INTO v_mmf FROM medicines WHERE owner_id = p_user_id AND name = 'MMF' AND strength = '500 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_mmf, 'morning', 2), (v_mmf, 'evening', 2)
  ON CONFLICT DO NOTHING;

  -- ── Afternoon ─────────────────────────────────
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit,
    category, is_critical, current_stock)
  VALUES (p_user_id, 'Solonex', '300 mg', 'tablet', 'tablet',
    'AKT', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_solonex;

  IF v_solonex IS NULL THEN
    SELECT id INTO v_solonex FROM medicines WHERE owner_id = p_user_id AND name = 'Solonex' AND strength = '300 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_solonex, 'afternoon', 1) ON CONFLICT DO NOTHING;

  -- Benadon 4mg — flag strength for confirmation
  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit,
    category, is_critical, needs_confirmation, confirmation_notes, current_stock)
  VALUES (p_user_id, 'Benadon', '4 mg', 'tablet', 'tablet',
    'AKT', true, true,
    'Supplied strength is 4 mg. Please confirm with prescribing doctor or pharmacist before use.',
    0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_benadon;

  IF v_benadon IS NULL THEN
    SELECT id INTO v_benadon FROM medicines WHERE owner_id = p_user_id AND name = 'Benadon' AND strength = '4 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_benadon, 'afternoon', 2) ON CONFLICT DO NOTHING;

  -- ── Evening / Night ───────────────────────────
  -- MMF already added above (evening schedule inserted there)
  -- Met XL already added above (evening schedule inserted there)
  -- Telma already added above (evening schedule inserted there)
  -- Lacosam already added above (evening schedule inserted there)

  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit,
    category, is_critical, current_stock)
  VALUES (p_user_id, 'Atrova', '20 mg', 'tablet', 'tablet',
    'Cholesterol / Heart', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_atrova;

  IF v_atrova IS NULL THEN
    SELECT id INTO v_atrova FROM medicines WHERE owner_id = p_user_id AND name = 'Atrova' AND strength = '20 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_atrova, 'evening', 1) ON CONFLICT DO NOTHING;

  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit,
    category, current_stock)
  VALUES (p_user_id, 'Fuberic', '40 mg', 'tablet', 'tablet',
    'Uric Acid', 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_fuberic;

  IF v_fuberic IS NULL THEN
    SELECT id INTO v_fuberic FROM medicines WHERE owner_id = p_user_id AND name = 'Fuberic' AND strength = '40 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_fuberic, 'evening', 1) ON CONFLICT DO NOTHING;

  INSERT INTO medicines (owner_id, name, strength, dosage_form, stock_unit,
    category, is_critical, current_stock)
  VALUES (p_user_id, 'Ecosprin', '150 mg', 'tablet', 'tablet',
    'Heart', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ecosprin;

  IF v_ecosprin IS NULL THEN
    SELECT id INTO v_ecosprin FROM medicines WHERE owner_id = p_user_id AND name = 'Ecosprin' AND strength = '150 mg';
  END IF;

  INSERT INTO medicine_schedules (medicine_id, time_period, quantity_per_dose)
  VALUES (v_ecosprin, 'evening', 1) ON CONFLICT DO NOTHING;

END;
$$;

-- Grant execute so the authenticated user can call it for their own account
GRANT EXECUTE ON FUNCTION public.seed_moms_medicines(uuid) TO authenticated;
