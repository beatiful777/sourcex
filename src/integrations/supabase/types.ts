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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      sample_requests: {
        Row: { created_at: string; id: string; message: string | null; product: string; quantity: number; status: string; supplier_application_id: string; supplier_note: string | null; updated_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
      notification_log: {
        Row: { created_at: string; id: string; kind: string; recipient: string; ref_id: string }
        Insert: { created_at?: string; id?: string; kind: string; recipient: string; ref_id: string }
        Update: { created_at?: string; id?: string; kind?: string; recipient?: string; ref_id?: string }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      rfq_applications: {
        Row: {
          company_name: string
          created_at: string
          id: string
          lead_time: string | null
          message: string
          min_order: string | null
          rfq_id: string
          status: string
          supplier_email: string
          supplier_id: string
          unit_price: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          lead_time?: string | null
          message: string
          min_order?: string | null
          rfq_id: string
          status?: string
          supplier_email: string
          supplier_id: string
          unit_price?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          lead_time?: string | null
          message?: string
          min_order?: string | null
          rfq_id?: string
          status?: string
          supplier_email?: string
          supplier_id?: string
          unit_price?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_applications_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          category: string
          country: string | null
          created_at: string
          details: string | null
          email: string
          id: string
          product: string
          quantity: string
          respond_by: string | null
          response_days: number
          status: string
          user_id: string | null
        }
        Insert: {
          category: string
          country?: string | null
          created_at?: string
          details?: string | null
          email: string
          id?: string
          product: string
          quantity: string
          respond_by?: string | null
          response_days?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          country?: string | null
          created_at?: string
          details?: string | null
          email?: string
          id?: string
          product?: string
          quantity?: string
          respond_by?: string | null
          response_days?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_applications: {
        Row: {
          business_email: string
          categories: string[]
          certifications: string[]
          city: string | null
          company_name: string
          contact_name: string
          country: string | null
          created_at: string
          factory_details: string | null
          id: string
          min_order_quantity: string | null
          status: string
          user_id: string | null
          website_or_catalog: string | null
        }
        Insert: {
          business_email: string
          categories?: string[]
          certifications?: string[]
          city?: string | null
          company_name: string
          contact_name: string
          country?: string | null
          created_at?: string
          factory_details?: string | null
          id?: string
          min_order_quantity?: string | null
          status?: string
          user_id?: string | null
          website_or_catalog?: string | null
        }
        Update: {
          business_email?: string
          categories?: string[]
          certifications?: string[]
          city?: string | null
          company_name?: string
          contact_name?: string
          country?: string | null
          created_at?: string
          factory_details?: string | null
          id?: string
          min_order_quantity?: string | null
          status?: string
          user_id?: string | null
          website_or_catalog?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          country_code: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extend_rfq: { Args: { _days: number; _rfq: string }; Returns: string }
      my_factory_profile: {
        Args: never
        Returns: { categories: string[]; certifications: string[]; company_name: string; country: string; factory_details: string; id: string; min_order_quantity: string; status: string; website_or_catalog: string }[]
      }
      update_factory_profile: {
        Args: { _categories: string[]; _certifications: string[]; _company_name: string; _country: string; _factory_details: string; _id: string; _min_order_quantity: string; _website: string }
        Returns: string
      }
      is_factory_of: { Args: { _app: string }; Returns: boolean }
      request_sample: { Args: { _message: string; _product: string; _quantity: number; _supplier: string }; Returns: string }
      set_sample_status: { Args: { _id: string; _note?: string; _status: string }; Returns: undefined }
      my_sample_requests: {
        Args: never
        Returns: { company_name: string; country: string; created_at: string; id: string; message: string; product: string; quantity: number; status: string; supplier_note: string }[]
      }
      factory_sample_requests: {
        Args: never
        Returns: { created_at: string; id: string; message: string; product: string; quantity: number; status: string; supplier_note: string }[]
      }
      accept_quote: { Args: { _accepted: boolean; _quote: string }; Returns: undefined }
      public_platform_stats: {
        Args: never
        Returns: { accepted_deals: number; countries: number; open_rfqs: number; quotes: number; suppliers: number }[]
      }
      can_apply_to_rfq: { Args: { _rfq: string }; Returns: boolean }
      cat_match: { Args: { _cat: string; _cats: string[] }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_open_rfqs: {
        Args: never
        Returns: {
          category: string
          country: string
          created_at: string
          details: string
          id: string
          is_mine: boolean
          product: string
          quantity: string
        }[]
      }
      my_approved_supplier: {
        Args: never
        Returns: {
          business_email: string
          categories: string[]
          company_name: string
          country: string
          id: string
        }[]
      }
      my_quotes: {
        Args: never
        Returns: {
          applied_at: string
          category: string
          country: string
          id: string
          lead_time: string
          message: string
          product: string
          quantity: string
          rfq_id: string
          rfq_status: string
          unit_price: string
        }[]
      }
      owns_rfq: { Args: { _rfq: string }; Returns: boolean }
      submit_quote: {
        Args: {
          _lead_time: string
          _message: string
          _min_order: string
          _rfq: string
          _unit_price: string
        }
        Returns: string
      }
      supplier_desk_rfqs: {
        Args: never
        Returns: {
          category: string
          country: string
          created_at: string
          details: string
          id: string
          lead_time: string
          message: string
          min_order: string
          product: string
          quantity: string
          quote_id: string
          quote_status: string
          unit_price: string
        }[]
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
