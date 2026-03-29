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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_events: {
        Row: {
          amount: number
          created_at: string | null
          event_date: string
          event_type: string
          id: string
          is_active: boolean
          movement_type: Database["public"]["Enums"]["transaction_type"]
          notes: string | null
          related_invoice_id: string | null
          scenario_key: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_active?: boolean
          movement_type: Database["public"]["Enums"]["transaction_type"]
          notes?: string | null
          related_invoice_id?: string | null
          scenario_key?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_active?: boolean
          movement_type?: Database["public"]["Enums"]["transaction_type"]
          notes?: string | null
          related_invoice_id?: string | null
          scenario_key?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_events_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          context_data: Json | null
          created_at: string | null
          id: string
          monetary_impact: number | null
          recommendation: string | null
          severity: Database["public"]["Enums"]["insight_severity"]
          summary: string
          time_impact_days: number | null
          title: string
          user_id: string | null
          why_it_matters: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          monetary_impact?: number | null
          recommendation?: string | null
          severity?: Database["public"]["Enums"]["insight_severity"]
          summary: string
          time_impact_days?: number | null
          title: string
          user_id?: string | null
          why_it_matters?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          monetary_impact?: number | null
          recommendation?: string | null
          severity?: Database["public"]["Enums"]["insight_severity"]
          summary?: string
          time_impact_days?: number | null
          title?: string
          user_id?: string | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_logs: {
        Row: {
          created_at: string | null
          created_invoices: string[] | null
          created_transactions: string[] | null
          error_message: string | null
          id: string
          processed_at: string | null
          processed_content: Json | null
          raw_content: string | null
          source: Database["public"]["Enums"]["intake_source"]
          source_reference: string | null
          status: Database["public"]["Enums"]["intake_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_invoices?: string[] | null
          created_transactions?: string[] | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_content?: Json | null
          raw_content?: string | null
          source: Database["public"]["Enums"]["intake_source"]
          source_reference?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_invoices?: string[] | null
          created_transactions?: string[] | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_content?: Json | null
          raw_content?: string | null
          source?: Database["public"]["Enums"]["intake_source"]
          source_reference?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          attachment_url: string | null
          category_id: string | null
          counterparty: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string | null
          paid_amount: number
          priority: string
          source_data: Json | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          category_id?: string | null
          counterparty: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string | null
          paid_amount?: number
          priority?: string
          source_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          category_id?: string | null
          counterparty?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string | null
          paid_amount?: number
          priority?: string
          source_data?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_connections: {
        Row: {
          created_at: string
          encrypted_access_token: string | null
          encrypted_refresh_token: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          mp_email: string | null
          mp_user_id: number
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          mp_email?: string | null
          mp_user_id: number
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          mp_email?: string | null
          mp_user_id?: number
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_movements: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date_approved: string | null
          date_created: string
          description: string | null
          id: string
          mp_connection_id: string
          mp_payment_id: number
          operation_type: string | null
          payer_email: string | null
          payer_name: string | null
          payment_method_id: string | null
          payment_type_id: string | null
          raw_data: Json
          status:
            | "approved"
            | "pending"
            | "rejected"
            | "cancelled"
            | "in_process"
            | "refunded"
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date_approved?: string | null
          date_created: string
          description?: string | null
          id?: string
          mp_connection_id: string
          mp_payment_id: number
          operation_type?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          raw_data?: Json
          status:
            | "approved"
            | "pending"
            | "rejected"
            | "cancelled"
            | "in_process"
            | "refunded"
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date_approved?: string | null
          date_created?: string
          description?: string | null
          id?: string
          mp_connection_id?: string
          mp_payment_id?: number
          operation_type?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          raw_data?: Json
          status?:
            | "approved"
            | "pending"
            | "rejected"
            | "cancelled"
            | "in_process"
            | "refunded"
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_movements_mp_connection_id_fkey"
            columns: ["mp_connection_id"]
            isOneToOne: false
            referencedRelation: "mp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          counterparty: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          invoice_id: string | null
          notes: string | null
          recurring: boolean
          source: Database["public"]["Enums"]["transaction_source"]
          source_data: Json | null
          status: Database["public"]["Enums"]["transaction_status"]
          suggested_category: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          date?: string
          description: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          recurring?: boolean
          source?: Database["public"]["Enums"]["transaction_source"]
          source_data?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          suggested_category?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          recurring?: boolean
          source?: Database["public"]["Enums"]["transaction_source"]
          source_data?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          suggested_category?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      insight_severity: "low" | "medium" | "high"
      intake_source:
        | "manual"
        | "email"
        | "whatsapp"
        | "csv"
        | "api"
        | "telegram"
      intake_status: "pending" | "processed" | "failed"
      invoice_status: "pending" | "partial" | "paid" | "overdue" | "cancelled"
      invoice_type: "receivable" | "payable"
      transaction_source:
        | "manual"
        | "bank"
        | "invoice"
        | "import"
        | "email"
        | "telegram"
        | "gmail"
      transaction_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "pending_review"
        | "duplicate"
        | "detected"
      transaction_type: "income" | "expense"
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
      insight_severity: ["low", "medium", "high"],
      intake_source: ["manual", "email", "whatsapp", "csv", "api", "telegram"],
      intake_status: ["pending", "processed", "failed"],
      invoice_status: ["pending", "partial", "paid", "overdue", "cancelled"],
      invoice_type: ["receivable", "payable"],
      transaction_source: [
        "manual",
        "bank",
        "invoice",
        "import",
        "email",
        "telegram",
        "gmail",
      ],
      transaction_status: [
        "pending",
        "confirmed",
        "cancelled",
        "pending_review",
        "duplicate",
        "detected",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
