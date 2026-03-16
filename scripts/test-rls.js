require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Let's see if we can query catedras using anon
  const { data, error } = await supabase.from('catedras').select('*').limit(1);
  console.log("CATEDRAS:", data, error);
}

check();
