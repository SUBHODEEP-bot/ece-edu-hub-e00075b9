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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          semester: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          semester: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          semester?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          organizer: string
          semester: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          organizer: string
          semester?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          organizer?: string
          semester?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mar_support: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          link_url: string
          semester: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link_url: string
          semester: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link_url?: string
          semester?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          semester: string
          subject: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          semester: string
          subject: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          semester?: string
          subject?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      organizers: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          link_url: string | null
          semester: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          semester: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          semester?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_email: string
          created_at: string
          id: string
          is_active: boolean | null
          mobile_number: string
          name: string
          semester: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          college_email: string
          created_at?: string
          id: string
          is_active?: boolean | null
          mobile_number: string
          name: string
          semester?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          college_email?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mobile_number?: string
          name?: string
          semester?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_papers: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          semester: string
          subject: string
          title: string
          updated_at: string
          uploaded_by: string | null
          year: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          semester: string
          subject: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          year: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          semester?: string
          subject?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          year?: string
        }
        Relationships: []
      }
      subject_schedules: {
        Row: {
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string
          day_of_week: string | null
          id: string
          is_active: boolean | null
          semester: string
          student_id: string
          subject: string
          updated_at: string
          weekly_classes: number
        }
        Insert: {
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          day_of_week?: string | null
          id?: string
          is_active?: boolean | null
          semester: string
          student_id: string
          subject: string
          updated_at?: string
          weekly_classes: number
        }
        Update: {
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          day_of_week?: string | null
          id?: string
          is_active?: boolean | null
          semester?: string
          student_id?: string
          subject?: string
          updated_at?: string
          weekly_classes?: number
        }
        Relationships: []
      }
      syllabus: {
        Row: {
          academic_year: string
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          semester: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          semester: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          semester?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      attendance_status: "present" | "absent" | "late"
      class_type: "theory" | "lab"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "student"],
      attendance_status: ["present", "absent", "late"],
      class_type: ["theory", "lab"],
    },
  },
} as const
