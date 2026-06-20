import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, anonKey);

async function run() {
  const { error } = await supabase.from('leads').update({ status: 'Editor Assigned' }).eq('lead_id', 'TEST1234');
  console.log("Error when assigning status:", error);
}
run();
