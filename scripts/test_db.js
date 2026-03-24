
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('notas').select('*').limit(1);
  if (error) {
    console.log('Error fetching notas:', error);
  } else {
    console.log('Notas sample:', data);
  }

  const { data: insc, error: inscError } = await supabase.from('inscripciones').select('*').limit(1);
  if (inscError) {
    console.log('Error fetching inscripciones:', inscError);
  } else {
    console.log('Inscripciones sample:', insc);
  }
}

test();
