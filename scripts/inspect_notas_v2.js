
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kcbzgbronxrdznxzwssr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log('Inspeccionando tabla "notas"...');
  
  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error al leer la tabla:', error);
  } else {
    console.log('Estructura detectada (primer registro):', data[0] ? Object.keys(data[0]) : 'Tabla vacía');
  }

  const testUpdate = {
    catedra_id: '00000000-0000-0000-0000-000000000000',
    inscripcion_id: '00000000-0000-0000-0000-000000000000',
    tipo: 'parcial_1',
    valor: 10
  };

  const { error: upsertError } = await supabase.from('notas').upsert([testUpdate]);
  console.log('Resultado del upsert de prueba (esperamos error fk):', upsertError?.message || 'Éxito (inesperado)');
  console.log('Detalles del error:', upsertError);
}

inspectTable();
