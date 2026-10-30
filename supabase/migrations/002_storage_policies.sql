-- ============================================================
-- Storage Policies for dose-photos bucket
-- Run AFTER creating the bucket named 'dose-photos' (private)
-- in the Supabase dashboard → Storage → New Bucket
-- ============================================================

-- Allow authenticated users to upload photos to their own folder
create policy "Users can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dose-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to view/download their own photos
create policy "Users can view their own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dose-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own photos
create policy "Users can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dose-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
