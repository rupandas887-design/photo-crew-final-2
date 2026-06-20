import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, anonKey);

async function run() {
  const { data: fetch1 } = await supabase.from('leads').select('*').limit(1);
  if (!fetch1 || fetch1.length === 0) return;
  const leadId = fetch1[0].lead_id;

  console.log("Updating lead:", leadId);
  console.log("Before:", fetch1[0].status, fetch1[0].current_status, fetch1[0].assigned_editor);

  const { data, error } = await supabase.from('leads').update({
    current_status: 'Editor Assigned',
    assigned_editor: 'John Doe',
    status: 'Editor Assigned'
  }).eq('lead_id', leadId).select();

  console.log("Update output:", data, error);
}
run();
