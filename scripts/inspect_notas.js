
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde el archivo .env.local de la carpeta presente
dotenv.config({ path: path.join(__dirname, '../presente/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: No se encontraron las variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log('Inspeccionando tabla "notas"...');
  
  // Intentar un upsert de prueba con un error controlado para ver qué columnas espera o qué falla
  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error al leer la tabla:', error);
  } else {
    console.log('Estructura detectada (primer registro):', data[0] ? Object.keys(data[0]) : 'Tabla vacía');
  }

  // Intentar insertar un registro ficticio o ver si hay constraints
  const testUpdate = {
    catedra_id: '00000000-0000-0000-0000-000000000000', // ID inválido a propósito para ver el error real
    inscripcion_id: '00000000-0000-0000-0000-000000000000',
    tipo: 'parcial_1',
    valor: 10
  };

  const { error: upsertError } = await supabase.from('notas').upsert([testUpdate]);
  console.log('Resultado del upsert de prueba:', upsertError?.message || 'Éxito (inesperado)');
}

inspectTable();
