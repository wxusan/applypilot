export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          language: string
          timezone: string
          subscription_status: string
          subscription_plan: string
          max_staff: number
          terms_accepted_at: string | null
          terms_accepted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['agencies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['agencies']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          telegram_chat_id: string | null
          phone: string | null
          language: string
          last_active_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      agency_members: {
        Row: {
          id: string
          agency_id: string
          user_id: string
          role: string
          is_active: boolean
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['agency_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['agency_members']['Insert']>
      }
      students: {
        Row: {
          id: string
          agency_id: string
          assigned_staff_id: string | null
          full_name: string
          preferred_name: string | null
          date_of_birth: string | null
          nationality: string | null
          passport_number: string | null
          passport_expiry: string | null
          photo_url: string | null
          email: string | null
          phone: string | null
          telegram_username: string | null
          parent_name: string | null
          parent_email: string | null
          parent_phone: string | null
          high_school_name: string | null
          high_school_country: string | null
          graduation_year: number | null
          gpa: number | null
          gpa_scale: number
          class_rank: string | null
          sat_total: number | null
          sat_math: number | null
          sat_reading: number | null
          act_score: number | null
          toefl_score: number | null
          ielts_score: number | null
          duolingo_score: number | null
          activities: Json
          awards: Json
          work_experience: Json
          languages: Json
          intended_major: string | null
          application_type: string
          notes: string | null
          status: string
          season: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      applications: {
        Row: {
          id: string
          agency_id: string
          student_id: string
          university_id: string | null
          university_name: string
          application_type: string
          deadline_regular: string | null
          deadline_financial_aid: string | null
          deadline_scholarship: string | null
          common_app_status: Json
          portal_url: string | null
          portal_username: string | null
          portal_password_encrypted: string | null
          status: string
          submitted_at: string | null
          decision_received_at: string | null
          decision: string | null
          scholarship_amount: number | null
          financial_aid_amount: number | null
          notes: string | null
          application_fee_paid: boolean
          fee_waiver_used: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      essays: {
        Row: {
          id: string
          agency_id: string
          student_id: string
          application_id: string | null
          prompt_id: string | null
          prompt_text: string | null
          content: string | null
          word_count: number | null
          version: number
          status: string
          ai_score: number | null
          ai_feedback: string | null
          plagiarism_score: number | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['essays']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['essays']['Insert']>
      }
      documents: {
        Row: {
          id: string
          agency_id: string
          student_id: string
          application_id: string | null
          type: string
          name: string
          storage_path: string
          storage_url: string | null
          file_size_bytes: number | null
          mime_type: string | null
          version: number
          ocr_text: string | null
          ocr_processed: boolean
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          uploaded_by: string | null
          uploaded_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      deadlines: {
        Row: {
          id: string
          agency_id: string
          student_id: string
          application_id: string | null
          title: string
          type: string | null
          due_date: string
          due_time: string | null
          timezone: string
          alert_days_before: Json
          alerts_sent: Json
          is_complete: boolean
          completed_at: string | null
          completed_by: string | null
          google_calendar_event_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['deadlines']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['deadlines']['Insert']>
      }
      agent_jobs: {
        Row: {
          id: string
          agency_id: string
          student_id: string | null
          application_id: string | null
          agent_type: string
          job_type: string
          status: string
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          requires_approval: boolean
          approval_message: string | null
          approved_by: string | null
          approved_at: string | null
          rejected_reason: string | null
          started_at: string | null
          completed_at: string | null
          duration_seconds: number | null
          screenshot_urls: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agent_jobs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agent_jobs']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          agency_id: string | null
          user_id: string | null
          student_id: string | null
          application_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
