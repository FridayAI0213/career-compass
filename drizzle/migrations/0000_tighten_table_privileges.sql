-- Defence in depth: anonymous visitors never use these tables (every RLS policy targets authenticated).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- Clients may only read billing state and reference data; writes stay server-side.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.career_specializations FROM authenticated;
-- Reverse with:
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions, public.career_specializations TO authenticated;