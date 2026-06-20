import dotenv from 'dotenv';
dotenv.config();

console.log('Available environment variables:');
console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('DATABASE_URL:', !!process.env.DATABASE_URL);
console.log('PGPASSWORD:', !!process.env.PGPASSWORD);
console.log('PGHOST:', !!process.env.PGHOST);
console.log('PGPORT:', !!process.env.PGPORT);
console.log('PGUSER:', !!process.env.PGUSER);
console.log('PGDATABASE:', !!process.env.PGDATABASE);
