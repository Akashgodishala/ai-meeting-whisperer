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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      age_verifications: {
        Row: {
          created_at: string
          customer_phone: string
          expires_at: string | null
          id: string
          order_id: string | null
          otp_code: string | null
          verification_method: string
          verification_status: string | null
          verified_age: number | null
        }
        Insert: {
          created_at?: string
          customer_phone: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          otp_code?: string | null
          verification_method: string
          verification_status?: string | null
          verified_age?: number | null
        }
        Update: {
          created_at?: string
          customer_phone?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          otp_code?: string | null
          verification_method?: string
          verification_status?: string | null
          verified_age?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "age_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "retailer_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_business_rules: {
        Row: {
          action_rule: string
          agent_id: string
          condition_rule: string
          created_at: string
          enabled: boolean | null
          id: string
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          action_rule: string
          agent_id: string
          condition_rule: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          action_rule?: string
          agent_id?: string
          condition_rule?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_business_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_channels: {
        Row: {
          agent_id: string
          channel_type: string
          created_at: string
          enabled: boolean | null
          id: string
          phone_numbers: string[] | null
          settings: Json
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          agent_id: string
          channel_type: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          phone_numbers?: string[] | null
          settings?: Json
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string
          channel_type?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          phone_numbers?: string[] | null
          settings?: Json
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_channels_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_integrations: {
        Row: {
          agent_id: string
          auth_type: string | null
          config: Json
          created_at: string
          credentials: Json
          enabled: boolean | null
          id: string
          integration_id: string
          integration_type: string
          name: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          auth_type?: string | null
          config?: Json
          created_at?: string
          credentials?: Json
          enabled?: boolean | null
          id?: string
          integration_id: string
          integration_type: string
          name: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          auth_type?: string | null
          config?: Json
          created_at?: string
          credentials?: Json
          enabled?: boolean | null
          id?: string
          integration_id?: string
          integration_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_integrations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_id: string
          channel_type: string
          conversation_history: Json | null
          created_at: string
          current_node_id: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          ended_at: string | null
          id: string
          satisfaction_rating: number | null
          sentiment_score: number | null
          session_id: string
          session_variables: Json | null
          started_at: string
          status: string | null
          total_duration: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          channel_type: string
          conversation_history?: Json | null
          created_at?: string
          current_node_id?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          ended_at?: string | null
          id?: string
          satisfaction_rating?: number | null
          sentiment_score?: number | null
          session_id: string
          session_variables?: Json | null
          started_at?: string
          status?: string | null
          total_duration?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          channel_type?: string
          conversation_history?: Json | null
          created_at?: string
          current_node_id?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          ended_at?: string | null
          id?: string
          satisfaction_rating?: number | null
          sentiment_score?: number | null
          session_id?: string
          session_variables?: Json | null
          started_at?: string
          status?: string | null
          total_duration?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          preview_image_url: string | null
          rating: number | null
          template_config: Json
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          preview_image_url?: string | null
          rating?: number | null
          template_config: Json
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          preview_image_url?: string | null
          rating?: number | null
          template_config?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_meetings: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          meeting_date: string
          meeting_link: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_link?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_link?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automated_reminder_settings: {
        Row: {
          business_end_time: string | null
          business_hours_only: boolean | null
          business_start_time: string | null
          created_at: string
          enable_24h_reminder: boolean | null
          enable_2h_reminder: boolean | null
          enable_30min_reminder: boolean | null
          enable_5min_reminder: boolean | null
          id: string
          max_retry_attempts: number | null
          reminder_message_template: string | null
          retry_interval_minutes: number | null
          timezone: string | null
          updated_at: string
          user_id: string
          voice_agent_id: string | null
        }
        Insert: {
          business_end_time?: string | null
          business_hours_only?: boolean | null
          business_start_time?: string | null
          created_at?: string
          enable_24h_reminder?: boolean | null
          enable_2h_reminder?: boolean | null
          enable_30min_reminder?: boolean | null
          enable_5min_reminder?: boolean | null
          id?: string
          max_retry_attempts?: number | null
          reminder_message_template?: string | null
          retry_interval_minutes?: number | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          voice_agent_id?: string | null
        }
        Update: {
          business_end_time?: string | null
          business_hours_only?: boolean | null
          business_start_time?: string | null
          created_at?: string
          enable_24h_reminder?: boolean | null
          enable_2h_reminder?: boolean | null
          enable_30min_reminder?: boolean | null
          enable_5min_reminder?: boolean | null
          id?: string
          max_retry_attempts?: number | null
          reminder_message_template?: string | null
          retry_interval_minutes?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          voice_agent_id?: string | null
        }
        Relationships: []
      }
      call_analytics: {
        Row: {
          call_duration: number | null
          call_id: string
          call_success: boolean | null
          created_at: string | null
          customer_phone: string
          error_reason: string | null
          id: string
          response_confidence: number | null
          response_detected: boolean | null
          sentiment_score: number | null
        }
        Insert: {
          call_duration?: number | null
          call_id: string
          call_success?: boolean | null
          created_at?: string | null
          customer_phone: string
          error_reason?: string | null
          id?: string
          response_confidence?: number | null
          response_detected?: boolean | null
          sentiment_score?: number | null
        }
        Update: {
          call_duration?: number | null
          call_id?: string
          call_success?: boolean | null
          created_at?: string | null
          customer_phone?: string
          error_reason?: string | null
          id?: string
          response_confidence?: number | null
          response_detected?: boolean | null
          sentiment_score?: number | null
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_id: string
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          duration: number | null
          end_time: string | null
          id: string
          metadata: Json | null
          recording_url: string | null
          start_time: string
          status: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          call_id: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          duration?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          recording_url?: string | null
          start_time?: string
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          call_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          recording_url?: string | null
          start_time?: string
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_flows: {
        Row: {
          agent_id: string
          created_at: string
          fallback_node_id: string | null
          id: string
          is_default: boolean | null
          name: string
          start_node_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          fallback_node_id?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          start_node_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          fallback_node_id?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          start_node_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_flows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          meeting_preferences: string | null
          name: string | null
          notes: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          meeting_preferences?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          meeting_preferences?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_id: number
          content: string
          created_at: string | null
          customer_data: Json | null
          filename: string
          id: string
          page: number
          user_id: string | null
        }
        Insert: {
          chunk_id: number
          content: string
          created_at?: string | null
          customer_data?: Json | null
          filename: string
          id?: string
          page: number
          user_id?: string | null
        }
        Update: {
          chunk_id?: number
          content?: string
          created_at?: string | null
          customer_data?: Json | null
          filename?: string
          id?: string
          page?: number
          user_id?: string | null
        }
        Relationships: []
      }
      flow_connections: {
        Row: {
          condition_rule: string | null
          connection_id: string
          created_at: string
          flow_id: string
          id: string
          label: string | null
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          condition_rule?: string | null
          connection_id: string
          created_at?: string
          flow_id: string
          id?: string
          label?: string | null
          source_node_id: string
          target_node_id: string
        }
        Update: {
          condition_rule?: string | null
          connection_id?: string
          created_at?: string
          flow_id?: string
          id?: string
          label?: string | null
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_connections_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_nodes: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          node_data: Json
          node_id: string
          node_type: string
          position_x: number
          position_y: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          flow_id: string
          id?: string
          node_data?: Json
          node_id: string
          node_type: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          node_data?: Json
          node_id?: string
          node_type?: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_call_logs: {
        Row: {
          call_duration_seconds: number | null
          call_id: string | null
          call_status: string
          call_type: string
          cost_cents: number | null
          created_at: string
          customer_response: string | null
          id: string
          meeting_id: string
          recording_url: string | null
          reminder_schedule_id: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          call_duration_seconds?: number | null
          call_id?: string | null
          call_status: string
          call_type: string
          cost_cents?: number | null
          created_at?: string
          customer_response?: string | null
          id?: string
          meeting_id: string
          recording_url?: string | null
          reminder_schedule_id?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          call_duration_seconds?: number | null
          call_id?: string | null
          call_status?: string
          call_type?: string
          cost_cents?: number | null
          created_at?: string
          customer_response?: string | null
          id?: string
          meeting_id?: string
          recording_url?: string | null
          reminder_schedule_id?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_call_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "automated_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_call_logs_reminder_schedule_id_fkey"
            columns: ["reminder_schedule_id"]
            isOneToOne: false
            referencedRelation: "meeting_reminder_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reminder_schedules: {
        Row: {
          call_id: string | null
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          reminder_type: string
          response_received: string | null
          scheduled_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          reminder_type: string
          response_received?: string | null
          scheduled_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          call_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          reminder_type?: string
          response_received?: string | null
          scheduled_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reminder_schedules_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "automated_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_responses: {
        Row: {
          call_sid: string
          created_at: string | null
          customer_name: string
          customer_phone: string
          id: string
          response_message: string
          response_type: string
        }
        Insert: {
          call_sid: string
          created_at?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          response_message: string
          response_type: string
        }
        Update: {
          call_sid?: string
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          response_message?: string
          response_type?: string
        }
        Relationships: []
      }
      retailer_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          retailer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          retailer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          retailer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_customers_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_inventory: {
        Row: {
          available: boolean | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          retailer_id: string | null
          size: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          retailer_id?: string | null
          size?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          retailer_id?: string | null
          size?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_inventory_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_orders: {
        Row: {
          call_session_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          driver_tip: number | null
          id: string
          items: Json
          notes: string | null
          order_type: string
          payment_link_url: string | null
          payment_status: string | null
          retailer_id: string | null
          service_fee: number | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          call_session_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          driver_tip?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_type: string
          payment_link_url?: string | null
          payment_status?: string | null
          retailer_id?: string | null
          service_fee?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          call_session_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          driver_tip?: number | null
          id?: string
          items?: Json
          notes?: string | null
          order_type?: string
          payment_link_url?: string | null
          payment_status?: string | null
          retailer_id?: string | null
          service_fee?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_orders_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_profiles: {
        Row: {
          address: string | null
          business_name: string
          business_type: string
          created_at: string
          id: string
          operating_hours: Json | null
          payment_methods: Json | null
          phone: string | null
          service_owner_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type: string
          created_at?: string
          id?: string
          operating_hours?: Json | null
          payment_methods?: Json | null
          phone?: string | null
          service_owner_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string
          created_at?: string
          id?: string
          operating_hours?: Json | null
          payment_methods?: Json | null
          phone?: string | null
          service_owner_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailer_profiles_service_owner_id_fkey"
            columns: ["service_owner_id"]
            isOneToOne: false
            referencedRelation: "service_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          phone_number: string
          retailer_id: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          retailer_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          retailer_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      scheduled_automations: {
        Row: {
          automation_type: string
          campaign_data: Json
          created_at: string | null
          customers: Json
          executed_at: string | null
          id: string
          retailer_id: string | null
          scheduled_for: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          automation_type: string
          campaign_data?: Json
          created_at?: string | null
          customers?: Json
          executed_at?: string | null
          id?: string
          retailer_id?: string | null
          scheduled_for: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_type?: string
          campaign_data?: Json
          created_at?: string | null
          customers?: Json
          executed_at?: string | null
          id?: string
          retailer_id?: string | null
          scheduled_for?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_automations_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_analytics: {
        Row: {
          call_duration: number | null
          call_outcome: string
          call_session_id: string | null
          created_at: string
          customer_satisfaction: number | null
          failure_reason: string | null
          id: string
          payment_processed: boolean | null
          sms_confirmed: boolean | null
          store_id: string | null
          transaction_completed: boolean | null
          updated_at: string
        }
        Insert: {
          call_duration?: number | null
          call_outcome: string
          call_session_id?: string | null
          created_at?: string
          customer_satisfaction?: number | null
          failure_reason?: string | null
          id?: string
          payment_processed?: boolean | null
          sms_confirmed?: boolean | null
          store_id?: string | null
          transaction_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          call_duration?: number | null
          call_outcome?: string
          call_session_id?: string | null
          created_at?: string
          customer_satisfaction?: number | null
          failure_reason?: string | null
          id?: string
          payment_processed?: boolean | null
          sms_confirmed?: boolean | null
          store_id?: string | null
          transaction_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_analytics_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_owners: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      voice_agents: {
        Row: {
          ai_model: string
          ai_temperature: number | null
          analytics_enabled: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_tokens: number | null
          name: string
          personality_custom_instructions: string | null
          personality_style: string | null
          personality_tone: string | null
          personality_traits: string[] | null
          retailer_id: string | null
          status: string
          system_prompt: string
          track_performance: boolean | null
          track_sentiment: boolean | null
          updated_at: string
          voice_id: string
          voice_pitch: number | null
          voice_provider: string
          voice_speed: number | null
        }
        Insert: {
          ai_model?: string
          ai_temperature?: number | null
          analytics_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          name: string
          personality_custom_instructions?: string | null
          personality_style?: string | null
          personality_tone?: string | null
          personality_traits?: string[] | null
          retailer_id?: string | null
          status?: string
          system_prompt?: string
          track_performance?: boolean | null
          track_sentiment?: boolean | null
          updated_at?: string
          voice_id?: string
          voice_pitch?: number | null
          voice_provider?: string
          voice_speed?: number | null
        }
        Update: {
          ai_model?: string
          ai_temperature?: number | null
          analytics_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          name?: string
          personality_custom_instructions?: string | null
          personality_style?: string | null
          personality_tone?: string | null
          personality_traits?: string[] | null
          retailer_id?: string | null
          status?: string
          system_prompt?: string
          track_performance?: boolean | null
          track_sentiment?: boolean | null
          updated_at?: string
          voice_id?: string
          voice_pitch?: number | null
          voice_provider?: string
          voice_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agents_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_appointments: {
        Row: {
          appointment_date: string
          appointment_type: string | null
          call_session_id: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          notes: string | null
          retailer_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          call_session_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          notes?: string | null
          retailer_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          call_session_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          notes?: string | null
          retailer_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_appointments_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_appointments_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_links: {
        Row: {
          call_session_id: string | null
          created_at: string
          customer_phone: string
          description: string | null
          expires_at: string | null
          id: string
          link_type: string | null
          link_url: string
          retailer_id: string | null
          sent_at: string | null
          title: string | null
        }
        Insert: {
          call_session_id?: string | null
          created_at?: string
          customer_phone: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_type?: string | null
          link_url: string
          retailer_id?: string | null
          sent_at?: string | null
          title?: string | null
        }
        Update: {
          call_session_id?: string | null
          created_at?: string
          customer_phone?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_type?: string | null
          link_url?: string
          retailer_id?: string | null
          sent_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_links_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_links_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_transactions: {
        Row: {
          amount: number | null
          call_session_id: string | null
          created_at: string
          currency: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          payment_method: string | null
          payment_status: string | null
          retailer_id: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          call_session_id?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          retailer_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          call_session_id?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          retailer_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_transactions_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_transactions_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
