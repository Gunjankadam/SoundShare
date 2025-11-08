// config/supabaseConfig.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseConnection() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  } else {
    console.log('✅ Supabase connected.');
    return true;
  }
}

module.exports = { supabase, checkSupabaseConnection };
