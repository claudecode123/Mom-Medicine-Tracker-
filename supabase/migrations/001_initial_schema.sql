-- ============================================================
-- Mom's Medicine Tracker – Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────
create table if not exists public.profiles (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null unique references auth.users(id) on delete cascade,
  patient_name             text not null default 'Mom',
  caregiver_name           text,
  timezone                 text not null default 'Asia/Kolkata',
  low_stock_threshold_days int  not null default 5,
  require_photo_for_dose   boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- 2. MEDICINES
-- ────────────────────────────────────────────────
create table if not exists public.medicines (
  id                    uuid primary key default uuid_generate_v4(),
  owner_id              uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  brand_name            text,
  strength              text,
  dosage_form           text not null default 'tablet'
                            check (dosage_form in ('tablet','capsule','syrup','drops','injection','cream','other')),
  stock_unit            text not null default 'tablet',
  instructions          text,
  prescription_notes    text,
  refill_notes          text,
  current_stock         numeric(10,2) not null default 0 check (current_stock >= 0),
  stock_threshold_days  int not null default 5,
  active                boolean not null default true,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists medicines_owner_idx on public.medicines(owner_id);

-- ────────────────────────────────────────────────
-- 3. MEDICINE SCHEDULES
-- ────────────────────────────────────────────────
create table if not exists public.medicine_schedules (
  id               uuid primary key default uuid_generate_v4(),
  medicine_id      uuid not null references public.medicines(id) on delete cascade,
  time_period      text not null
                       check (time_period in ('early_morning','morning','afternoon','evening')),
  scheduled_time   time,
  quantity_per_dose numeric(10,2) not null default 1 check (quantity_per_dose > 0),
  applicable_days  text[],
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (medicine_id, time_period)
);

create index if not exists schedules_medicine_idx on public.medicine_schedules(medicine_id);

-- ────────────────────────────────────────────────
-- 4. DOSE RECORDS
-- ────────────────────────────────────────────────
create table if not exists public.dose_records (
  id                   uuid primary key default uuid_generate_v4(),
  medicine_id          uuid not null references public.medicines(id) on delete restrict,
  schedule_id          uuid references public.medicine_schedules(id) on delete set null,
  scheduled_period     text not null
                           check (scheduled_period in ('early_morning','morning','afternoon','evening')),
  scheduled_for        timestamptz not null,
  administered_at      timestamptz,
  quantity_administered numeric(10,2),
  status               text not null default 'pending'
                           check (status in ('pending','given','skipped','overdue')),
  photo_storage_path   text,
  notes                text,
  correction_reason    text,
  created_by           uuid not null references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- prevent duplicate dose records for same medicine+period+day
  unique (medicine_id, scheduled_period, scheduled_for)
);

create index if not exists dose_records_medicine_idx on public.dose_records(medicine_id);
create index if not exists dose_records_scheduled_for_idx on public.dose_records(scheduled_for);
create index if not exists dose_records_status_idx on public.dose_records(status);

-- ────────────────────────────────────────────────
-- 5. STOCK TRANSACTIONS  (append-only ledger)
-- ────────────────────────────────────────────────
create table if not exists public.stock_transactions (
  id               uuid primary key default uuid_generate_v4(),
  medicine_id      uuid not null references public.medicines(id) on delete restrict,
  dose_record_id   uuid references public.dose_records(id) on delete set null,
  transaction_type text not null
                       check (transaction_type in ('dose_deduction','stock_addition','manual_correction','dose_reversal')),
  quantity_change  numeric(10,2) not null,
  balance_after    numeric(10,2) not null,
  reason           text,
  created_by       uuid not null references auth.users(id),
  created_at       timestamptz not null default now()
);

create index if not exists stock_tx_medicine_idx on public.stock_transactions(medicine_id);
create index if not exists stock_tx_dose_idx on public.stock_transactions(dose_record_id);

-- ────────────────────────────────────────────────
-- 6. DOCTOR VISITS
-- ────────────────────────────────────────────────
create table if not exists public.doctor_visits (
  id                       uuid primary key default uuid_generate_v4(),
  owner_id                 uuid not null references auth.users(id) on delete cascade,
  doctor_name              text not null,
  clinic_name              text,
  visit_date               date not null,
  reason                   text,
  visit_summary            text,
  follow_up_date           date,
  prescription_notes       text,
  attachment_storage_path  text,
  notes_for_next           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists doctor_visits_owner_idx on public.doctor_visits(owner_id);
create index if not exists doctor_visits_date_idx on public.doctor_visits(visit_date desc);

-- ════════════════════════════════════════════════
-- ATOMIC DATABASE FUNCTIONS
-- ════════════════════════════════════════════════

-- record_dose_with_stock: records a dose AND deducts stock atomically.
-- Idempotent: if a 'given' dose already exists for this medicine+period+day, it returns the existing record.
create or replace function public.record_dose_with_stock(
  p_medicine_id       uuid,
  p_schedule_id       uuid,
  p_scheduled_period  text,
  p_scheduled_for     timestamptz,
  p_quantity_administered numeric,
  p_photo_storage_path text,
  p_notes             text,
  p_user_id           uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_medicine        medicines%rowtype;
  v_new_stock       numeric;
  v_dose_id         uuid;
  v_existing_id     uuid;
begin
  -- Lock the medicine row
  select * into v_medicine from medicines where id = p_medicine_id for update;
  if not found then
    raise exception 'Medicine not found';
  end if;

  -- Idempotency: check for an already-given dose for this slot
  select id into v_existing_id
  from dose_records
  where medicine_id = p_medicine_id
    and scheduled_period = p_scheduled_period
    and scheduled_for::date = p_scheduled_for::date
    and status = 'given';

  if v_existing_id is not null then
    return jsonb_build_object('dose_record_id', v_existing_id, 'new_stock', v_medicine.current_stock);
  end if;

  -- Check stock
  if v_medicine.current_stock < p_quantity_administered then
    raise exception 'Insufficient stock: % available, % requested', v_medicine.current_stock, p_quantity_administered;
  end if;

  -- Deduct stock
  v_new_stock := v_medicine.current_stock - p_quantity_administered;

  update medicines
  set current_stock = v_new_stock,
      updated_at    = now()
  where id = p_medicine_id;

  -- Upsert dose record
  insert into dose_records (
    medicine_id, schedule_id, scheduled_period, scheduled_for,
    administered_at, quantity_administered, status,
    photo_storage_path, notes, created_by, updated_at
  )
  values (
    p_medicine_id, p_schedule_id, p_scheduled_period, p_scheduled_for,
    now(), p_quantity_administered, 'given',
    p_photo_storage_path, p_notes, p_user_id, now()
  )
  on conflict (medicine_id, scheduled_period, scheduled_for)
  do update set
    administered_at       = excluded.administered_at,
    quantity_administered = excluded.quantity_administered,
    status                = excluded.status,
    photo_storage_path    = excluded.photo_storage_path,
    notes                 = excluded.notes,
    updated_at            = now()
  returning id into v_dose_id;

  -- Record stock transaction
  insert into stock_transactions (
    medicine_id, dose_record_id, transaction_type,
    quantity_change, balance_after, reason, created_by
  )
  values (
    p_medicine_id, v_dose_id, 'dose_deduction',
    -p_quantity_administered, v_new_stock, 'Dose recorded', p_user_id
  );

  return jsonb_build_object('dose_record_id', v_dose_id, 'new_stock', v_new_stock);
end;
$$;

-- add_stock: adds stock and records the transaction
create or replace function public.add_stock(
  p_medicine_id uuid,
  p_quantity    numeric,
  p_reason      text,
  p_user_id     uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_stock numeric;
begin
  update medicines
  set current_stock = current_stock + p_quantity,
      updated_at    = now()
  where id = p_medicine_id
  returning current_stock into v_new_stock;

  if not found then
    raise exception 'Medicine not found';
  end if;

  insert into stock_transactions (
    medicine_id, transaction_type,
    quantity_change, balance_after, reason, created_by
  )
  values (
    p_medicine_id, 'stock_addition',
    p_quantity, v_new_stock, coalesce(p_reason, 'Stock added'), p_user_id
  );

  return jsonb_build_object('new_stock', v_new_stock);
end;
$$;

-- correct_stock: manual adjustment with audit trail
create or replace function public.correct_stock(
  p_medicine_id    uuid,
  p_quantity_change numeric,
  p_reason         text,
  p_user_id        uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_medicine   medicines%rowtype;
  v_new_stock  numeric;
begin
  select * into v_medicine from medicines where id = p_medicine_id for update;
  if not found then raise exception 'Medicine not found'; end if;

  v_new_stock := v_medicine.current_stock + p_quantity_change;

  if v_new_stock < 0 then
    raise exception 'Correction would result in negative stock (%.2f). Use a smaller adjustment.', v_new_stock;
  end if;

  update medicines set current_stock = v_new_stock, updated_at = now() where id = p_medicine_id;

  insert into stock_transactions (
    medicine_id, transaction_type,
    quantity_change, balance_after, reason, created_by
  )
  values (
    p_medicine_id, 'manual_correction',
    p_quantity_change, v_new_stock, p_reason, p_user_id
  );

  return jsonb_build_object('new_stock', v_new_stock);
end;
$$;

-- ════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.medicine_schedules enable row level security;
alter table public.dose_records enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.doctor_visits enable row level security;

-- PROFILES
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- MEDICINES
create policy "Users can view own medicines"   on public.medicines for select using (auth.uid() = owner_id);
create policy "Users can insert own medicines" on public.medicines for insert with check (auth.uid() = owner_id);
create policy "Users can update own medicines" on public.medicines for update using (auth.uid() = owner_id);
create policy "Users can delete own medicines" on public.medicines for delete using (auth.uid() = owner_id);

-- MEDICINE SCHEDULES (access via medicine ownership)
create policy "Users can view schedules for own medicines"
  on public.medicine_schedules for select
  using (exists (select 1 from public.medicines where id = medicine_id and owner_id = auth.uid()));

create policy "Users can insert schedules for own medicines"
  on public.medicine_schedules for insert
  with check (exists (select 1 from public.medicines where id = medicine_id and owner_id = auth.uid()));

create policy "Users can update schedules for own medicines"
  on public.medicine_schedules for update
  using (exists (select 1 from public.medicines where id = medicine_id and owner_id = auth.uid()));

create policy "Users can delete schedules for own medicines"
  on public.medicine_schedules for delete
  using (exists (select 1 from public.medicines where id = medicine_id and owner_id = auth.uid()));

-- DOSE RECORDS
create policy "Users can view own dose records"   on public.dose_records for select using (auth.uid() = created_by);
create policy "Users can insert own dose records" on public.dose_records for insert with check (auth.uid() = created_by);
create policy "Users can update own dose records" on public.dose_records for update using (auth.uid() = created_by);

-- STOCK TRANSACTIONS (read-only for users; writes via functions only)
create policy "Users can view own stock transactions"
  on public.stock_transactions for select
  using (auth.uid() = created_by);

create policy "Users can insert own stock transactions"
  on public.stock_transactions for insert
  with check (auth.uid() = created_by);

-- DOCTOR VISITS
create policy "Users can view own visits"   on public.doctor_visits for select using (auth.uid() = owner_id);
create policy "Users can insert own visits" on public.doctor_visits for insert with check (auth.uid() = owner_id);
create policy "Users can update own visits" on public.doctor_visits for update using (auth.uid() = owner_id);
create policy "Users can delete own visits" on public.doctor_visits for delete using (auth.uid() = owner_id);

-- ════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- ════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, patient_name, timezone)
  values (new.id, 'Mom', 'Asia/Kolkata')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
