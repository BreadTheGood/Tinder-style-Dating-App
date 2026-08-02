-- Script to seed fake profiles for testing.
-- You can run this directly in the Supabase SQL Editor.

WITH new_users AS (
  INSERT INTO "Users" ("id", "email", "created_at")
  VALUES 
    (gen_random_uuid(), 'fake1@example.com', now()),
    (gen_random_uuid(), 'fake2@example.com', now()),
    (gen_random_uuid(), 'fake3@example.com', now()),
    (gen_random_uuid(), 'fake4@example.com', now())
  RETURNING id
),
new_profiles AS (
  INSERT INTO "Profiles" ("id", "user_id", "name", "bio", "gender", "birthdate")
  SELECT 
    gen_random_uuid(),
    id,
    CASE row_number() over() 
      WHEN 1 THEN 'Sofía' 
      WHEN 2 THEN 'Camila' 
      WHEN 3 THEN 'Valentina' 
      ELSE 'Mateo'
    END,
    CASE row_number() over() 
      WHEN 1 THEN 'Amante de los perros y el café 🐶☕' 
      WHEN 2 THEN 'Buscando a alguien para ir a conciertos 🎸' 
      WHEN 3 THEN 'Me encanta viajar y conocer lugares nuevos ✈️' 
      ELSE 'Gym, código y buena comida 🍔'
    END,
    CASE row_number() over() 
      WHEN 4 THEN 'male' 
      ELSE 'female' 
    END,
    CASE row_number() over() 
      WHEN 1 THEN '1998-05-14'::date
      WHEN 2 THEN '1996-11-20'::date
      WHEN 3 THEN '1999-02-10'::date
      ELSE '1995-08-05'::date
    END
  FROM new_users
  RETURNING id
)
INSERT INTO "Photos" ("id", "profile_id", "photo_url", "sort_order", "is_main")
SELECT 
  gen_random_uuid(),
  id,
  CASE row_number() over() 
    WHEN 1 THEN 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop'
    WHEN 3 THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop'
    ELSE 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop'
  END,
  1,
  true
FROM new_profiles;
