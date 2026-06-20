import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, anonKey);

async function run() {
  const { data: fetch1 } = await supabase.from('orders').select('*').limit(1);
  if (!fetch1 || fetch1.length === 0) return;
  const orderId = fetch1[0].order_id;
  
  const { data, error } = await supabase.from('orders').update({
    current_stage: 'Editor Assigned'
  }).eq('order_id', orderId).select();

  console.log("Order update error:", error);
}
run();
