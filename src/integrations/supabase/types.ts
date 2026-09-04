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
      ai_dimension_insights: {
        Row: {
          content: Json
          created_at: string
          dimension: number
          edited_by_asesor: boolean
          id: string
          include_in_report: boolean
          kind: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          dimension: number
          edited_by_asesor?: boolean
          id?: string
          include_in_report?: boolean
          kind?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          dimension?: number
          edited_by_asesor?: boolean
          id?: string
          include_in_report?: boolean
          kind?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_dimension_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_dimension_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          dimension: number
          doc_status: string
          doc_type: string
          id: string
          notes: string | null
          organization_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          dimension: number
          doc_status: string
          doc_type: string
          id?: string
          notes?: string | null
          organization_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          dimension?: number
          doc_status?: string
          doc_type?: string
          id?: string
          notes?: string | null
          organization_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "document_reviews_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fgd_notes: {
        Row: {
          consensus: number | null
          dimension: number
          facilitator: string | null
          id: string
          organization_id: string
          quotes: string | null
          status: string
          themes: string | null
          updated_at: string
        }
        Insert: {
          consensus?: number | null
          dimension: number
          facilitator?: string | null
          id?: string
          organization_id: string
          quotes?: string | null
          status?: string
          themes?: string | null
          updated_at?: string
        }
        Update: {
          consensus?: number | null
          dimension?: number
          facilitator?: string | null
          id?: string
          organization_id?: string
          quotes?: string | null
          status?: string
          themes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fgd_notes_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fgd_notes_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_notes: {
        Row: {
          dimension: number
          findings: string | null
          id: string
          informant_role: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          dimension: number
          findings?: string | null
          id?: string
          informant_role?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          dimension?: number
          findings?: string | null
          id?: string
          informant_role?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_notes_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "interview_notes_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          started_on: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          started_on?: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          started_on?: string
          status?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          comment: string | null
          created_at: string
          dimension: number
          id: string
          organization_id: string
          question_id: string
          respondent_id: string
          respondent_name: string | null
          role: string
          score: number
          tenure: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dimension: number
          id?: string
          organization_id: string
          question_id: string
          respondent_id: string
          respondent_name?: string | null
          role: string
          score: number
          tenure?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          dimension?: number
          id?: string
          organization_id?: string
          question_id?: string
          respondent_id?: string
          respondent_name?: string | null
          role?: string
          score?: number
          tenure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dimension_comments: {
        Row: {
          comment: string | null
          dimension: number | null
          organization_id: string | null
          organization_name: string | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dimension_scores: {
        Row: {
          avg_score: number | null
          dimension: number | null
          organization_id: string | null
          organization_name: string | null
          respondents: number | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_progress"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "responses_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_progress: {
        Row: {
          organization_id: string | null
          respondents: number | null
          role: string | null
        }
        Relationships: []
      }
      triangulation_cells: {
        Row: {
          dimension: number | null
          n: number | null
          organization_id: string | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
