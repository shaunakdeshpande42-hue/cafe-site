import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OrderStatus = "received" | "preparing" | "ready" | "completed";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total: number;
  pickup_time: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  special_instructions: string | null;
  created_at: string;
  customers?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
}
