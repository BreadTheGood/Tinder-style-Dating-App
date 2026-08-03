-- Permitir a los usuarios insertar su propio perfil (necesario si el trigger no corrió)
CREATE POLICY "Users can insert their own profile" 
ON public."Profiles"
FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = user_id );

-- Permitir a los usuarios actualizar su propio perfil
CREATE POLICY "Users can update their own profile" 
ON public."Profiles"
FOR UPDATE
TO authenticated 
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- Permitir que cualquiera vea los perfiles (si no existía ya)
CREATE POLICY "Public profiles are viewable by everyone."
ON public."Profiles"
FOR SELECT
USING ( true );
