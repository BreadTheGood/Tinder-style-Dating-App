-- 1. Create a function that runs every time a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our custom Users table
  INSERT INTO public."Users" (id, email, created_at)
  VALUES (new.id, new.email, now());

  -- Automatically create an empty Profile for them as well
  INSERT INTO public."Profiles" (id, user_id, name, bio, gender)
  VALUES (
    gen_random_uuid(), 
    new.id, 
    split_part(new.email, '@', 1), -- Usa la primera parte del email como nombre por defecto
    '¡Bienvenido a mi perfil!',
    'other'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger to fire the function automatically on sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
