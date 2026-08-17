CREATE TABLE IF NOT EXISTS public."TelemetryEvents" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    profile_id uuid REFERENCES public."Profiles"(id),
    event_id uuid REFERENCES public."Events"(id),
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public."TelemetryEvents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden insertar su propia telemetria" 
ON public."TelemetryEvents" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers pueden leer telemetria"
ON public."TelemetryEvents" FOR SELECT
USING (EXISTS (SELECT 1 FROM public."Managers" WHERE id = auth.uid() AND is_active = true));

GRANT INSERT ON public."TelemetryEvents" TO authenticated;
GRANT SELECT ON public."TelemetryEvents" TO authenticated;

