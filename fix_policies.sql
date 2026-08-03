-- 1. Eliminar perfiles duplicados creados por el bug (dejamos el más reciente)
DELETE FROM public."Profiles" a USING (
    SELECT MAX(id) as max_id, user_id
    FROM public."Profiles" 
    GROUP BY user_id HAVING COUNT(*) > 1
) b WHERE a.user_id = b.user_id AND a.id <> b.max_id;

-- 2. Asegurarnos que todo el mundo pueda LEER (SELECT) los perfiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public."Profiles";
CREATE POLICY "Public profiles are viewable by everyone"
ON public."Profiles"
FOR SELECT
USING ( true );

-- 3. Asegurarnos que todo el mundo pueda LEER (SELECT) las fotos
DROP POLICY IF EXISTS "Public photos are viewable by everyone" ON public."Photos";
CREATE POLICY "Public photos are viewable by everyone"
ON public."Photos"
FOR SELECT
USING ( true );
