export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_activity: {
        Row: {
          agent: string
          analysis_type: string | null
          created_at: string
          error: string | null
          id: string
          input_ref: Json
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          output_ref: Json
          output_tokens: number | null
          prompt_version: string | null
          provider: string | null
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          agent: string
          analysis_type?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_ref?: Json
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_ref?: Json
          output_tokens?: number | null
          prompt_version?: string | null
          provider?: string | null
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          agent?: string
          analysis_type?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_ref?: Json
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_ref?: Json
          output_tokens?: number | null
          prompt_version?: string | null
          provider?: string | null
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string | null
          company: string
          cover_letter_document_id: string | null
          created_at: string
          follow_up_at: string | null
          id: string
          job_id: string | null
          location: string | null
          notes: string | null
          outcome: string | null
          outcome_at: string | null
          pipeline_position: number
          position: string
          recruiter_contact: string | null
          recruiter_name: string | null
          resume_document_id: string | null
          saved_at: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          cover_letter_document_id?: string | null
          created_at?: string
          follow_up_at?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          pipeline_position?: number
          position: string
          recruiter_contact?: string | null
          recruiter_name?: string | null
          resume_document_id?: string | null
          saved_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          cover_letter_document_id?: string | null
          created_at?: string
          follow_up_at?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          pipeline_position?: number
          position?: string
          recruiter_contact?: string | null
          recruiter_name?: string | null
          resume_document_id?: string | null
          saved_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cover_letter_document_id_fkey"
            columns: ["cover_letter_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_document_id_fkey"
            columns: ["resume_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      career_profiles: {
        Row: {
          ai_profile: Json
          career_goals: string | null
          category: string | null
          constraints: string | null
          created_at: string
          field: string | null
          id: string
          level: Database["public"]["Enums"]["career_level"] | null
          long_term_objective: string | null
          onboarding_completed_at: string | null
          onboarding_step: string
          open_to_relocation: boolean | null
          preferred_locations: string[]
          priorities: string[]
          professional_summary: string | null
          requires_sponsorship: boolean | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          specialization: string | null
          specialization_id: string | null
          sub_specialization: string | null
          target_employers: string[]
          target_industries: string[]
          target_roles: string[]
          timeline: string | null
          travel_tolerance: string | null
          updated_at: string
          user_id: string
          work_authorization: string | null
          work_mode: Database["public"]["Enums"]["work_mode"] | null
          years_experience: number | null
        }
        Insert: {
          ai_profile?: Json
          career_goals?: string | null
          category?: string | null
          constraints?: string | null
          created_at?: string
          field?: string | null
          id?: string
          level?: Database["public"]["Enums"]["career_level"] | null
          long_term_objective?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: string
          open_to_relocation?: boolean | null
          preferred_locations?: string[]
          priorities?: string[]
          professional_summary?: string | null
          requires_sponsorship?: boolean | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          specialization?: string | null
          specialization_id?: string | null
          sub_specialization?: string | null
          target_employers?: string[]
          target_industries?: string[]
          target_roles?: string[]
          timeline?: string | null
          travel_tolerance?: string | null
          updated_at?: string
          user_id: string
          work_authorization?: string | null
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
          years_experience?: number | null
        }
        Update: {
          ai_profile?: Json
          career_goals?: string | null
          category?: string | null
          constraints?: string | null
          created_at?: string
          field?: string | null
          id?: string
          level?: Database["public"]["Enums"]["career_level"] | null
          long_term_objective?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: string
          open_to_relocation?: boolean | null
          preferred_locations?: string[]
          priorities?: string[]
          professional_summary?: string | null
          requires_sponsorship?: boolean | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          specialization?: string | null
          specialization_id?: string | null
          sub_specialization?: string | null
          target_employers?: string[]
          target_industries?: string[]
          target_roles?: string[]
          timeline?: string | null
          travel_tolerance?: string | null
          updated_at?: string
          user_id?: string
          work_authorization?: string | null
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_profiles_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "career_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      career_specializations: {
        Row: {
          certifications: string[]
          common_qualifications: string[]
          core_skills: string[]
          created_at: string
          evaluation_criteria: Json
          id: string
          industry: string | null
          profession: string
          progression: Json
          role_families: string[]
          source: Database["public"]["Enums"]["data_source"]
          specialty: string | null
          sub_specialty: string | null
          terminology: string[]
          updated_at: string
        }
        Insert: {
          certifications?: string[]
          common_qualifications?: string[]
          core_skills?: string[]
          created_at?: string
          evaluation_criteria?: Json
          id?: string
          industry?: string | null
          profession: string
          progression?: Json
          role_families?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          specialty?: string | null
          sub_specialty?: string | null
          terminology?: string[]
          updated_at?: string
        }
        Update: {
          certifications?: string[]
          common_qualifications?: string[]
          core_skills?: string[]
          created_at?: string
          evaluation_criteria?: Json
          id?: string
          industry?: string | null
          profession?: string
          progression?: Json
          role_families?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          specialty?: string | null
          sub_specialty?: string | null
          terminology?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          confidence: number | null
          created_at: string
          credential_id: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          credential_id?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          credential_id?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          extracted: Json
          extraction_status: string
          file_size: number | null
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          parent_document_id: string | null
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          extracted?: Json
          extraction_status?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          parent_document_id?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          extracted?: Json
          extraction_status?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          parent_document_id?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          academic_projects: string[]
          confidence: number | null
          coursework: string[]
          created_at: string
          degree: string | null
          end_date: string | null
          field_of_study: string | null
          gpa: number | null
          id: string
          institution: string
          is_current: boolean
          source: Database["public"]["Enums"]["data_source"]
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_projects?: string[]
          confidence?: number | null
          coursework?: string[]
          created_at?: string
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution: string
          is_current?: boolean
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_projects?: string[]
          confidence?: number | null
          coursework?: string[]
          created_at?: string
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution?: string
          is_current?: boolean
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          achievements: string[]
          confidence: number | null
          created_at: string
          employer: string
          employment_type: string | null
          end_date: string | null
          id: string
          is_current: boolean
          location: string | null
          quantified_results: string[]
          responsibilities: string[]
          skills: string[]
          source: Database["public"]["Enums"]["data_source"]
          start_date: string | null
          technologies: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[]
          confidence?: number | null
          created_at?: string
          employer: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          quantified_results?: string[]
          responsibilities?: string[]
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          technologies?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[]
          confidence?: number | null
          created_at?: string
          employer?: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          quantified_results?: string[]
          responsibilities?: string[]
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          technologies?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extracurriculars: {
        Row: {
          accomplishments: string[]
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          organization: string
          role: string
          skills: string[]
          source: Database["public"]["Enums"]["data_source"]
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accomplishments?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          organization: string
          role: string
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accomplishments?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          organization?: string
          role?: string
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          application_id: string
          created_at: string
          due_at: string | null
          follow_up_type: string
          generated_message: string | null
          id: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          due_at?: string | null
          follow_up_type?: string
          generated_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          due_at?: string | null
          follow_up_type?: string
          generated_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          accomplishments: string[]
          created_at: string
          employer: string
          end_date: string | null
          id: string
          is_current: boolean
          location: string | null
          responsibilities: string[]
          skills: string[]
          source: Database["public"]["Enums"]["data_source"]
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accomplishments?: string[]
          created_at?: string
          employer: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          responsibilities?: string[]
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accomplishments?: string[]
          created_at?: string
          employer?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          responsibilities?: string[]
          skills?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          answers: Json
          application_id: string | null
          created_at: string
          evaluations: Json
          feedback: string | null
          id: string
          improvements: string[]
          interview_id: string | null
          questions: Json
          scores: Json
          session_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          application_id?: string | null
          created_at?: string
          evaluations?: Json
          feedback?: string | null
          id?: string
          improvements?: string[]
          interview_id?: string | null
          questions?: Json
          scores?: Json
          session_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          application_id?: string | null
          created_at?: string
          evaluations?: Json
          feedback?: string | null
          id?: string
          improvements?: string[]
          interview_id?: string | null
          questions?: Json
          scores?: Json
          session_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          id: string
          interview_type: string | null
          interviewer: string | null
          notes: string | null
          preparation_status: string
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          interview_type?: string | null
          interviewer?: string | null
          notes?: string | null
          preparation_status?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          interview_type?: string | null
          interviewer?: string | null
          notes?: string | null
          preparation_status?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_analyses: {
        Row: {
          ai_generated: boolean
          ai_reasoning: string | null
          certification_score: number | null
          compensation_score: number | null
          created_at: string
          education_score: number | null
          evidence: Json
          experience_score: number | null
          gaps: string[]
          id: string
          industry_score: number | null
          job_id: string
          location_score: number | null
          match_score: number
          missing_qualifications: string[]
          model_metadata: Json
          preferences_score: number | null
          recommendation:
            | Database["public"]["Enums"]["job_recommendation"]
            | null
          recommendation_priority: number | null
          risk_factors: string[]
          seniority_score: number | null
          skills_score: number | null
          strengths: string[]
          trajectory_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          ai_reasoning?: string | null
          certification_score?: number | null
          compensation_score?: number | null
          created_at?: string
          education_score?: number | null
          evidence?: Json
          experience_score?: number | null
          gaps?: string[]
          id?: string
          industry_score?: number | null
          job_id: string
          location_score?: number | null
          match_score?: number
          missing_qualifications?: string[]
          model_metadata?: Json
          preferences_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["job_recommendation"]
            | null
          recommendation_priority?: number | null
          risk_factors?: string[]
          seniority_score?: number | null
          skills_score?: number | null
          strengths?: string[]
          trajectory_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          ai_reasoning?: string | null
          certification_score?: number | null
          compensation_score?: number | null
          created_at?: string
          education_score?: number | null
          evidence?: Json
          experience_score?: number | null
          gaps?: string[]
          id?: string
          industry_score?: number | null
          job_id?: string
          location_score?: number | null
          match_score?: number
          missing_qualifications?: string[]
          model_metadata?: Json
          preferences_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["job_recommendation"]
            | null
          recommendation_priority?: number | null
          risk_factors?: string[]
          seniority_score?: number | null
          skills_score?: number | null
          strengths?: string[]
          trajectory_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_recommendations: {
        Row: {
          analysis_id: string | null
          dismissed_at: string | null
          generated_at: string
          id: string
          job_id: string
          priority: Database["public"]["Enums"]["job_recommendation"]
          rank: number
          reasoning: string | null
          recommended_action: string | null
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          dismissed_at?: string | null
          generated_at?: string
          id?: string
          job_id: string
          priority?: Database["public"]["Enums"]["job_recommendation"]
          rank: number
          reasoning?: string | null
          recommended_action?: string | null
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          dismissed_at?: string | null
          generated_at?: string
          id?: string
          job_id?: string
          priority?: Database["public"]["Enums"]["job_recommendation"]
          rank?: number
          reasoning?: string | null
          recommended_action?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_recommendations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "job_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_url: string | null
          certifications: string[]
          company: string
          content_hash: string | null
          created_at: string
          created_by: string | null
          deadline_at: string | null
          degree_requirement: string | null
          description: string | null
          employment_type: string | null
          external_id: string | null
          id: string
          industry: string | null
          is_demo: boolean
          location: string | null
          location_normalized: string | null
          min_years_experience: number | null
          normalized: Json
          posted_at: string | null
          preferred_qualifications: string[]
          requirements: string[]
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: Database["public"]["Enums"]["career_level"] | null
          skills: string[]
          source: string
          source_url: string | null
          status: string
          title: string
          updated_at: string
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          application_url?: string | null
          certifications?: string[]
          company: string
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          degree_requirement?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          location_normalized?: string | null
          min_years_experience?: number | null
          normalized?: Json
          posted_at?: string | null
          preferred_qualifications?: string[]
          requirements?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: Database["public"]["Enums"]["career_level"] | null
          skills?: string[]
          source?: string
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          application_url?: string | null
          certifications?: string[]
          company?: string
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          degree_requirement?: string | null
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          location_normalized?: string | null
          min_years_experience?: number | null
          normalized?: Json
          posted_at?: string | null
          preferred_qualifications?: string[]
          requirements?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: Database["public"]["Enums"]["career_level"] | null
          skills?: string[]
          source?: string
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string | null
          notification_type: string
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          outcome: string | null
          skills_demonstrated: string[]
          source: Database["public"]["Enums"]["data_source"]
          technologies: string[]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          outcome?: string | null
          skills_demonstrated?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          technologies?: string[]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          outcome?: string | null
          skills_demonstrated?: string[]
          source?: Database["public"]["Enums"]["data_source"]
          technologies?: string[]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string
          evidence: string | null
          id: string
          name: string
          proficiency: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          evidence?: string | null
          id?: string
          name: string
          proficiency?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          evidence?: string | null
          id?: string
          name?: string
          proficiency?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      target_niches: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          priority: number
          rationale: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          priority?: number
          rationale?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          priority?: number
          rationale?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          feature: string | null
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature?: string | null
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string | null
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_entitlement: {
        Args: { _uid: string }
        Returns: {
          analyses_limit: number
          period_end: string
          period_start: string
          plans_limit: number
          tier: string
        }[]
      }
      ai_quota_status: { Args: never; Returns: Json }
      consume_ai_quota: {
        Args: { _feature?: string; _kind: string }
        Returns: string
      }
      release_ai_quota: { Args: { _event_id: string }; Returns: undefined }
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "recruiter"
        | "interview"
        | "final_round"
        | "offer"
        | "rejected"
        | "withdrawn"
      career_level:
        | "student"
        | "entry"
        | "junior"
        | "mid"
        | "senior"
        | "lead"
        | "principal"
        | "executive"
      data_source:
        | "user"
        | "resume_extraction"
        | "ai_inference"
        | "employer"
        | "system"
      document_kind:
        | "resume"
        | "cover_letter"
        | "application_document"
        | "interview_notes"
        | "other"
      job_recommendation:
        | "apply_immediately"
        | "apply"
        | "consider"
        | "low_priority"
        | "skip"
      work_mode: "remote" | "hybrid" | "onsite" | "flexible"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "saved",
        "applied",
        "recruiter",
        "interview",
        "final_round",
        "offer",
        "rejected",
        "withdrawn",
      ],
      career_level: [
        "student",
        "entry",
        "junior",
        "mid",
        "senior",
        "lead",
        "principal",
        "executive",
      ],
      data_source: [
        "user",
        "resume_extraction",
        "ai_inference",
        "employer",
        "system",
      ],
      document_kind: [
        "resume",
        "cover_letter",
        "application_document",
        "interview_notes",
        "other",
      ],
      job_recommendation: [
        "apply_immediately",
        "apply",
        "consider",
        "low_priority",
        "skip",
      ],
      work_mode: ["remote", "hybrid", "onsite", "flexible"],
    },
  },
} as const
