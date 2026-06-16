/**
 * Supabase database types — 8-table MVP schema.
 *
 * NOTE: this is a hand-written placeholder kept in sync with
 * supabase/migrations/. Once the local stack is running, regenerate the
 * authoritative version with:
 *
 *     pnpm db:types     # supabase gen types typescript --local > this file
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          brand_color: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_color?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          brand_color?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          contact_email: string | null;
          logo_url: string | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          contact_email?: string | null;
          logo_url?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          contact_email?: string | null;
          logo_url?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          name: string;
          base_url: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          name: string;
          base_url: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          name?: string;
          base_url?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          initiated_by: string | null;
          status: Database["public"]["Enums"]["scan_status"];
          scan_type: Database["public"]["Enums"]["scan_type"];
          target_urls: Json;
          wcag_level: Database["public"]["Enums"]["wcag_level"];
          score: number | null;
          totals: Json;
          pages_scanned: number;
          error_reason: string | null;
          share_token: string | null;
          is_public: boolean;
          shared_at: string | null;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          initiated_by?: string | null;
          status?: Database["public"]["Enums"]["scan_status"];
          scan_type?: Database["public"]["Enums"]["scan_type"];
          target_urls?: Json;
          wcag_level?: Database["public"]["Enums"]["wcag_level"];
          score?: number | null;
          totals?: Json;
          pages_scanned?: number;
          error_reason?: string | null;
          share_token?: string | null;
          is_public?: boolean;
          shared_at?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          initiated_by?: string | null;
          status?: Database["public"]["Enums"]["scan_status"];
          scan_type?: Database["public"]["Enums"]["scan_type"];
          target_urls?: Json;
          wcag_level?: Database["public"]["Enums"]["wcag_level"];
          score?: number | null;
          totals?: Json;
          pages_scanned?: number;
          error_reason?: string | null;
          share_token?: string | null;
          is_public?: boolean;
          shared_at?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scan_pages: {
        Row: {
          id: string;
          scan_id: string;
          organization_id: string;
          url: string;
          status: Database["public"]["Enums"]["page_status"];
          http_status: number | null;
          score: number | null;
          totals: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          organization_id: string;
          url: string;
          status?: Database["public"]["Enums"]["page_status"];
          http_status?: number | null;
          score?: number | null;
          totals?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          organization_id?: string;
          url?: string;
          status?: Database["public"]["Enums"]["page_status"];
          http_status?: number | null;
          score?: number | null;
          totals?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      violations: {
        Row: {
          id: string;
          scan_page_id: string;
          organization_id: string;
          rule_id: string;
          impact: Database["public"]["Enums"]["impact_level"];
          wcag_criteria: string[];
          description: string | null;
          help_text: string | null;
          help_url: string | null;
          nodes: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_page_id: string;
          organization_id: string;
          rule_id: string;
          impact: Database["public"]["Enums"]["impact_level"];
          wcag_criteria?: string[];
          description?: string | null;
          help_text?: string | null;
          help_url?: string | null;
          nodes?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_page_id?: string;
          organization_id?: string;
          rule_id?: string;
          impact?: Database["public"]["Enums"]["impact_level"];
          wcag_criteria?: string[];
          description?: string | null;
          help_text?: string | null;
          help_url?: string | null;
          nodes?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: Database["public"]["Enums"]["plan_tier"];
          status: Database["public"]["Enums"]["subscription_status"];
          current_period_end: string | null;
          seats: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          current_period_end?: string | null;
          seats?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          current_period_end?: string | null;
          seats?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      owns_org: {
        Args: { org_id: string };
        Returns: boolean;
      };
      claim_next_scan: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["scans"]["Row"] | null;
      };
    };
    Enums: {
      scan_status: "queued" | "running" | "completed" | "failed" | "partial";
      scan_type: "single" | "list";
      wcag_level: "A" | "AA" | "AAA";
      page_status: "ok" | "error";
      impact_level: "critical" | "serious" | "moderate" | "minor";
      plan_tier: "free" | "starter" | "agency" | "scale";
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
    };
    CompositeTypes: Record<never, never>;
  };
}

/* ---- Convenience helpers (match Supabase's generated exports) ------------- */

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
