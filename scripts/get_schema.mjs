import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcvuxcnhsslygczubvum.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: clases } = await supabase.from('clases').select('*').limit(2);
  console.log('CLASES:', clases);
  const { data: insc } = await supabase.from('inscripciones').select('*').limit(2);
  console.log('INSCRIPCIONES:', insc);
}
run();
