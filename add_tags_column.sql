-- Agregar columna tags a Profiles
ALTER TABLE public."Profiles" 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
