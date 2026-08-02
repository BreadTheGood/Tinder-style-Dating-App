-- Política para permitir que todo el mundo vea las fotos (Lectura)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Política para permitir que usuarios logueados suban, actualicen o borren sus fotos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'photos' )
WITH CHECK ( bucket_id = 'photos' );
