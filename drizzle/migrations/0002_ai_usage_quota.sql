CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('analysis', 'plan')),
  feature text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usage_events_user_created_idx ON public.usage_events (user_id, created_at);

REVOKE ALL ON public.usage_events FROM anon;
GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_read_own" ON public.usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Entitlement is derived only from server-written subscription rows.
CREATE OR REPLACE FUNCTION public.ai_entitlement(_uid uuid)
RETURNS TABLE (tier text, analyses_limit integer, plans_limit integer, period_start timestamptz, period_end timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  SELECT * INTO s FROM public.subscriptions
   WHERE user_id = _uid
     AND plan IN ('pro', 'complimentary')
     AND status IN ('active', 'trialing', 'past_due')
     AND (current_period_end IS NULL OR current_period_end > now())
   ORDER BY updated_at DESC LIMIT 1;
  IF FOUND THEN
    tier := s.plan;
    analyses_limit := 10;
    plans_limit := 15;
    IF s.current_period_start IS NOT NULL AND s.current_period_end IS NOT NULL THEN
      period_start := s.current_period_start;
      period_end := s.current_period_end;
    ELSE
      period_start := date_trunc('month', now());
      period_end := date_trunc('month', now()) + interval '1 month';
    END IF;
  ELSE
    tier := 'trial';
    analyses_limit := 3;
    plans_limit := 2;
    period_start := '-infinity'::timestamptz;
    period_end := NULL;
  END IF;
  RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION public.ai_quota_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE e record; used_a integer; used_p integer; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO e FROM public.ai_entitlement(uid);
  SELECT count(*) FILTER (WHERE kind = 'analysis'), count(*) FILTER (WHERE kind = 'plan')
    INTO used_a, used_p FROM public.usage_events
   WHERE user_id = uid AND created_at >= e.period_start;
  RETURN jsonb_build_object(
    'tier', e.tier,
    'analyses', jsonb_build_object('limit', e.analyses_limit, 'used', used_a, 'remaining', greatest(e.analyses_limit - used_a, 0)),
    'plans', jsonb_build_object('limit', e.plans_limit, 'used', used_p, 'remaining', greatest(e.plans_limit - used_p, 0)),
    'period_start', CASE WHEN e.period_start = '-infinity'::timestamptz THEN NULL ELSE e.period_start END,
    'period_end', e.period_end);
END $$;

-- Reserves one unit; returns the event id, or NULL when the allowance is used up.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(_kind text, _feature text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE e record; used integer; lim integer; uid uuid := auth.uid(); new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _kind NOT IN ('analysis', 'plan') THEN RAISE EXCEPTION 'invalid kind'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT * INTO e FROM public.ai_entitlement(uid);
  lim := CASE WHEN _kind = 'analysis' THEN e.analyses_limit ELSE e.plans_limit END;
  SELECT count(*) INTO used FROM public.usage_events
   WHERE user_id = uid AND kind = _kind AND created_at >= e.period_start;
  IF used >= lim THEN RETURN NULL; END IF;
  INSERT INTO public.usage_events (user_id, kind, feature) VALUES (uid, _kind, _feature) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

-- Refund for a failed AI call. Server-only so users cannot refund themselves.
CREATE OR REPLACE FUNCTION public.release_ai_quota(_event_id uuid)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.usage_events WHERE id = _event_id;
$$;

REVOKE ALL ON FUNCTION public.ai_entitlement(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_quota_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_quota(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_ai_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_entitlement(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_quota(uuid) TO service_role;