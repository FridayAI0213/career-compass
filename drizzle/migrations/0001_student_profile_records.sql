CREATE TABLE public.target_niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  rationale text,
  priority integer NOT NULL DEFAULT 0,
  source public.data_source NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.extracurriculars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  organization text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  accomplishments text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  source public.data_source NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT extracurriculars_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer text NOT NULL,
  title text NOT NULL,
  location text,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  responsibilities text[] NOT NULL DEFAULT '{}',
  accomplishments text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  source public.data_source NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT internships_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

REVOKE ALL ON public.target_niches, public.extracurriculars, public.internships FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.target_niches, public.extracurriculars, public.internships TO authenticated;
GRANT ALL ON public.target_niches, public.extracurriculars, public.internships TO service_role;

ALTER TABLE public.target_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracurriculars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own" ON public.target_niches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.extracurriculars FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.internships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX target_niches_user_id_idx ON public.target_niches (user_id);
CREATE INDEX extracurriculars_user_id_idx ON public.extracurriculars (user_id);
CREATE INDEX internships_user_id_idx ON public.internships (user_id);

CREATE TRIGGER target_niches_updated BEFORE UPDATE ON public.target_niches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER extracurriculars_updated BEFORE UPDATE ON public.extracurriculars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER internships_updated BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();