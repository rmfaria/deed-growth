-- Storage policies for materials bucket
-- Allow anyone to read (public bucket)
CREATE POLICY "materials_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'materials');

-- Allow anyone to upload (anon + authenticated)
CREATE POLICY "materials_public_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'materials');

-- Allow anyone to update
CREATE POLICY "materials_public_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'materials');

-- Allow anyone to delete
CREATE POLICY "materials_public_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'materials');
