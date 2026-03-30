
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Conectando a Supabase...');
  const { data, error } = await supabase.from('notas').select('*').limit(1);
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Columnas encontradas en tabla NOTAS:');
  console.log(Object.keys(data[0] || {}));
}

check();
