-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ enums ============
CREATE TYPE public.data_source AS ENUM ('user','resume_extraction','ai_inference','employer','system');
CREATE TYPE public.work_mode AS ENUM ('remote','hybrid','onsite','flexible');
CREATE TYPE public.career_level AS ENUM ('student','entry','junior','mid','senior','lead','principal','executive');
CREATE TYPE public.application_status AS ENUM ('saved','applied','recruiter','interview','final_round','offer','rejected','withdrawn');
CREATE TYPE public.job_recommendation AS ENUM ('apply_immediately','apply','consider','low_priority','skip');
CREATE TYPE public.document_kind AS ENUM ('resume','cover_letter','application_document','interview_notes','other');

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data ->> 'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ career specialization library (shared) ============
CREATE TABLE public.career_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession TEXT NOT NULL,
  specialty TEXT,
  sub_specialty TEXT,
  industry TEXT,
  role_families TEXT[] NOT NULL DEFAULT '{}',
  core_skills TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  common_qualifications TEXT[] NOT NULL DEFAULT '{}',
  terminology TEXT[] NOT NULL DEFAULT '{}',
  progression JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  source public.data_source NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.career_specializations TO authenticated;
GRANT ALL ON public.career_specializations TO service_role;
ALTER TABLE public.career_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specializations_read" ON public.career_specializations FOR SELECT TO authenticated USING (true);
CREATE TRIGGER specializations_updated BEFORE UPDATE ON public.career_specializations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ career profiles ============
CREATE TABLE public.career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  specialization_id UUID REFERENCES public.career_specializations(id) ON DELETE SET NULL,
  field TEXT,
  category TEXT,
  specialization TEXT,
  sub_specialization TEXT,
  level public.career_level,
  years_experience NUMERIC,
  professional_summary TEXT,
  career_goals TEXT,
  long_term_objective TEXT,
  target_roles TEXT[] NOT NULL DEFAULT '{}',
  target_industries TEXT[] NOT NULL DEFAULT '{}',
  target_employers TEXT[] NOT NULL DEFAULT '{}',
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  work_mode public.work_mode,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  open_to_relocation BOOLEAN,
  travel_tolerance TEXT,
  work_authorization TEXT,
  requires_sponsorship BOOLEAN,
  constraints TEXT,
  priorities TEXT[] NOT NULL DEFAULT '{}',
  timeline TEXT,
  onboarding_step TEXT NOT NULL DEFAULT 'field',
  onboarding_completed_at TIMESTAMPTZ,
  ai_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_profiles TO authenticated;
GRANT ALL ON public.career_profiles TO service_role;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_profiles_own" ON public.career_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER career_profiles_updated BEFORE UPDATE ON public.career_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ education ============
CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  gpa NUMERIC,
  coursework TEXT[] NOT NULL DEFAULT '{}',
  academic_projects TEXT[] NOT NULL DEFAULT '{}',
  source public.data_source NOT NULL DEFAULT 'user',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO authenticated;
GRANT ALL ON public.education TO service_role;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_own" ON public.education FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER education_updated BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ experience ============
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  employer TEXT NOT NULL,
  title TEXT NOT NULL,
  employment_type TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  achievements TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  quantified_results TEXT[] NOT NULL DEFAULT '{}',
  source public.data_source NOT NULL DEFAULT 'user',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiences TO authenticated;
GRANT ALL ON public.experiences TO service_role;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiences_own" ON public.experiences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER experiences_updated BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ skills ============
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  proficiency TEXT,
  years_experience NUMERIC,
  evidence TEXT,
  source public.data_source NOT NULL DEFAULT 'user',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_own" ON public.skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER skills_updated BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ certifications ============
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  expiration_date DATE,
  credential_id TEXT,
  source public.data_source NOT NULL DEFAULT 'user',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_own" ON public.certifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER certifications_updated BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ projects ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  skills_demonstrated TEXT[] NOT NULL DEFAULT '{}',
  outcome TEXT,
  url TEXT,
  source public.data_source NOT NULL DEFAULT 'user',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_own" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ jobs ============
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'demo',
  external_id TEXT,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_normalized TEXT,
  work_mode public.work_mode,
  employment_type TEXT,
  seniority public.career_level,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  preferred_qualifications TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  degree_requirement TEXT,
  min_years_experience NUMERIC,
  industry TEXT,
  posted_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  application_url TEXT,
  source_url TEXT,
  normalized JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_read" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ job analyses ============
CREATE TABLE public.job_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score NUMERIC NOT NULL DEFAULT 0,
  skills_score NUMERIC,
  experience_score NUMERIC,
  education_score NUMERIC,
  certification_score NUMERIC,
  location_score NUMERIC,
  compensation_score NUMERIC,
  seniority_score NUMERIC,
  industry_score NUMERIC,
  trajectory_score NUMERIC,
  preferences_score NUMERIC,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  gaps TEXT[] NOT NULL DEFAULT '{}',
  risk_factors TEXT[] NOT NULL DEFAULT '{}',
  missing_qualifications TEXT[] NOT NULL DEFAULT '{}',
  ai_reasoning TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  recommendation public.job_recommendation,
  recommendation_priority INTEGER,
  model_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT ALL ON public.job_analyses TO service_role;
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_analyses_own" ON public.job_analyses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER job_analyses_updated BEFORE UPDATE ON public.job_analyses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ job recommendations ============
CREATE TABLE public.job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.job_analyses(id) ON DELETE SET NULL,
  rank INTEGER NOT NULL,
  priority public.job_recommendation NOT NULL DEFAULT 'consider',
  reasoning TEXT,
  recommended_action TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_recommendations TO authenticated;
GRANT ALL ON public.job_recommendations TO service_role;
ALTER TABLE public.job_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_recommendations_own" ON public.job_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ documents ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind public.document_kind NOT NULL DEFAULT 'resume',
  title TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT,
  file_size INTEGER,
  content TEXT,
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_own" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ applications ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  status public.application_status NOT NULL DEFAULT 'saved',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  resume_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  cover_letter_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  recruiter_name TEXT,
  recruiter_contact TEXT,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,
  outcome TEXT,
  outcome_at TIMESTAMPTZ,
  pipeline_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ interviews ============
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_type TEXT,
  scheduled_at TIMESTAMPTZ,
  interviewer TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  preparation_status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews_own" ON public.interviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER interviews_updated BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES public.interviews(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL DEFAULT 'mock',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback TEXT,
  improvements TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_sessions_own" ON public.interview_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER interview_sessions_updated BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ follow ups ============
CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  follow_up_type TEXT NOT NULL DEFAULT 'check_in',
  due_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  generated_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_ups_own" ON public.follow_ups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER follow_ups_updated BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ai activity ============
CREATE TABLE public.ai_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  agent TEXT NOT NULL,
  analysis_type TEXT,
  input_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT,
  model TEXT,
  prompt_version TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_activity TO authenticated;
GRANT ALL ON public.ai_activity TO service_role;
ALTER TABLE public.ai_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_activity_own" ON public.ai_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ notifications ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'info',
  priority TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ subscriptions ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_read_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ indexes ============
CREATE INDEX idx_jobs_status ON public.jobs (status, posted_at DESC);
CREATE INDEX idx_job_analyses_user_score ON public.job_analyses (user_id, match_score DESC);
CREATE INDEX idx_job_recs_user_rank ON public.job_recommendations (user_id, rank);
CREATE INDEX idx_applications_user_status ON public.applications (user_id, status);
CREATE INDEX idx_documents_user_kind ON public.documents (user_id, kind);

-- ============ storage policies for private career documents ============
CREATE POLICY "career_docs_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'career-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "career_docs_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'career-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "career_docs_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'career-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "career_docs_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'career-documents' AND auth.uid()::text = (storage.foldername(name))[1]);