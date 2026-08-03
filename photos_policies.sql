-- Permitir a los usuarios insertar sus propias fotos
-- Verificamos que el profile_id coincida con el id del perfil del usuario autenticado
CREATE POLICY "Users can insert their own photos" 
ON public."Photos"
FOR INSERT 
TO authenticated 
WITH CHECK ( profile_id IN (SELECT id FROM public."Profiles" WHERE user_id = auth.uid()) );

-- Permitir que cualquiera vea las fotos (si no existía ya)
CREATE POLICY "Public photos are viewable by everyone"
ON public."Photos"
FOR SELECT
USING ( true );

-- Permitir a los usuarios borrar sus propias fotos
CREATE POLICY "Users can delete their own photos" 
ON public."Photos"
FOR DELETE
TO authenticated 
USING ( profile_id IN (SELECT id FROM public."Profiles" WHERE user_id = auth.uid()) );
