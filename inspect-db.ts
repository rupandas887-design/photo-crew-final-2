import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

async function run() {
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.from('lead_packages').select('*').limit(1);
  if (error) {
    console.log('Error querying lead_packages table:', error.message);
  } else {
    console.log('lead_packages table exists! Data:', data);
  }
}
run();
