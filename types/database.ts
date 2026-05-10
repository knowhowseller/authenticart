export type UserRole = 'student' | 'instructor' | 'admin'
export type BookingStatus =
  | 'pending_payment' | 'pending_approval' | 'approved' | 'paid' | 'rejected'
  | 'cancelled' | 'completed' | 'expired' | 'refunded'
export type ConfirmationMode = 'instant' | 'request'
export type ClassStatus = 'draft' | 'published' | 'closed'
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'hold'
export type InstructorStatus = 'pending' | 'approved' | 'rejected'

export interface ClassAttributes {
  craft_type?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration_active?: number
  duration_curing?: number
  pickup_method?: 'shipping' | 'pickup' | 'both'
  required_items?: string[]
  provided_items?: string[]
  cautions?: string[]
  min_age?: number
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          role: UserRole
          region: string | null
          marketing_agreed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          role?: UserRole
          region?: string | null
          marketing_agreed?: boolean
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      instructor_profiles: {
        Row: {
          id: string
          instructor_id: string
          bio: string | null
          region: string | null
          profile_image: string | null
          status: InstructorStatus
          certification_docs: unknown[]
          approved_at: string | null
          approved_by: string | null
          payout_account: Record<string, string> | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          instructor_id: string
          bio?: string | null
          region?: string | null
          profile_image?: string | null
          status?: InstructorStatus
          certification_docs?: unknown[]
          payout_account?: Record<string, string> | null
        }
        Update: Partial<Database['public']['Tables']['instructor_profiles']['Insert']>
      }
      classes: {
        Row: {
          id: string
          instructor_id: string
          title: string
          description: string | null
          region: string
          location_address: string | null
          price: number
          capacity: number
          status: ClassStatus
          thumbnail_url: string | null
          confirmation_mode: ConfirmationMode
          attributes: ClassAttributes
          created_at: string
          updated_at: string
        }
        Insert: {
          instructor_id: string
          title: string
          description?: string | null
          region: string
          location_address?: string | null
          price: number
          capacity: number
          status?: ClassStatus
          thumbnail_url?: string | null
          confirmation_mode?: ConfirmationMode
          attributes?: ClassAttributes
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      class_schedules: {
        Row: {
          id: string
          class_id: string
          start_at: string
          end_at: string | null
          max_students: number
          booked_count: number
          created_at: string
        }
        Insert: {
          class_id: string
          start_at: string
          end_at?: string | null
          max_students: number
          booked_count?: number
        }
        Update: Partial<Database['public']['Tables']['class_schedules']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          schedule_id: string
          student_id: string
          status: BookingStatus
          approval_expires_at: string | null
          gross_amount: number
          pg_fee: number
          platform_fee: number
          instructor_payout: number
          payout_status: PayoutStatus
          payout_id: string | null
          payment_id: string | null
          receipt_url: string | null
          refund_amount: number
          refund_reason: string | null
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          schedule_id: string
          student_id: string
          status?: BookingStatus
          approval_expires_at?: string | null
          gross_amount: number
          pg_fee?: number
          platform_fee?: number
          instructor_payout?: number
          payout_status?: PayoutStatus
          payment_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          retail_price: number
          wholesale_price: number | null
          is_instructor_only: boolean
          is_active: boolean
          stock_qty: number
          thumbnail_url: string | null
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          category?: string | null
          retail_price: number
          wholesale_price?: number | null
          is_instructor_only?: boolean
          is_active?: boolean
          stock_qty?: number
          thumbnail_url?: string | null
          images?: string[]
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          product_id: string | null
          quantity: number
          total_amount: number
          status: OrderStatus
          payment_id: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_address: string | null
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          product_id?: string | null
          quantity?: number
          total_amount: number
          status?: OrderStatus
          payment_id?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_address?: string | null
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      payouts: {
        Row: {
          id: string
          instructor_id: string
          period_year: number
          period_month: number
          total_gross: number
          total_pg_fee: number
          total_platform_fee: number
          total_payout: number
          booking_count: number
          order_count: number
          status: PayoutStatus
          paid_at: string | null
          statement_url: string | null
          created_at: string
        }
        Insert: {
          instructor_id: string
          period_year: number
          period_month: number
          total_gross?: number
          total_pg_fee?: number
          total_platform_fee?: number
          total_payout?: number
          booking_count?: number
          order_count?: number
          status?: PayoutStatus
          paid_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          actor_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decrement_seat: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
