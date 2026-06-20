import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

console.log('SUPABASE_URL:', url);

async function test() {
  if (!url || !anonKey) {
    console.log('No credentials found in environment!');
    return;
  }
  const supabase = createClient(url, anonKey);
  
  const tables = ['users', 'leads', 'orders', 'operations', 'raw_footage', 'production', 'payments', 'activity_logs', 'notifications', 'production_staff', 'packages', 'lead_packages'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}" error:`, error.message);
    } else {
      console.log(`Table "${table}" succeeds! Row count:`, data.length);
    }
  }
}

test();
