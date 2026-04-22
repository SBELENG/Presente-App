import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

const IDS = {
  educacion: 'a56bc6ec-f239-423d-b4be-886ec4ec1780',  // educacacionenenfermeria@hum
  materno:   'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a',  // 5214maternoinf@hum
}

async function run() {
  console.log('========================================')
  console.log('  DIAGNÓSTICO COMPLETO - PRESTTI')
  console.log('========================================')

  // 1. Perfiles — get ALL columns
  console.log('\n--- 1. PERFILES (select *) ---')
  const { data: perfiles, error: pe } = await supabase
    .from('perfiles')
    .select('*')
    .in('id', Object.values(IDS))
  
  if (pe) console.error('Error perfiles:', pe)
  else if (!perfiles || perfiles.length === 0) {
    console.log('⚠️  NO SE ENCONTRARON PERFILES para ninguno de los dos IDs!')
  } else {
    perfiles.forEach(p => console.log(JSON.stringify(p, null, 2)))
  }

  // 2. Cátedras completas
  console.log('\n--- 2. CÁTEDRAS (select *) ---')
  for (const [label, id] of Object.entries(IDS)) {
    const { data: cats, error: ce } = await supabase
      .from('catedras')
      .select('*')
      .eq('docente_id', id)
    
    if (ce) { console.error(`Error catedras ${label}:`, ce); continue }
    console.log(`\n[${label.toUpperCase()}] docente_id=${id}`)
    if (!cats || cats.length === 0) {
      console.log('  Sin cátedras')
    } else {
      cats.forEach(c => {
        console.log(`  Cátedra: ${c.nombre} (${c.codigo})`)
        console.log(`    id: ${c.id}`)
        console.log(`    dias_clase: ${JSON.stringify(c.dias_clase)}`)
        console.log(`    fecha_inicio: ${c.fecha_inicio}`)
        console.log(`    fecha_fin: ${c.fecha_fin}`)
        console.log(`    porcentaje_asistencia: ${c.porcentaje_asistencia}`)
        console.log(`    cant_parciales: ${c.cant_parciales}`)
        console.log(`    cant_recuperatorios: ${c.cant_recuperatorios}`)
        console.log(`    es_promocional: ${c.es_promocional}`)
        console.log(`    nota_promocion_minima: ${c.nota_promocion_minima}`)
        console.log(`    carrera: ${c.carrera}`)
        console.log(`    facultad: ${c.facultad}`)
        console.log(`    comision: ${c.comision}`)
      })
    }
  }

  // 3. Clases for each cátedra
  console.log('\n--- 3. CLASES (count) ---')
  const catIds = [
    '7dee9248-ddfb-4591-b19c-c2cb24f9250d', // Educación en Enfermería
    'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'  // Materno Infantil
  ]
  for (const catId of catIds) {
    const { count, error: clErr } = await supabase
      .from('clases')
      .select('*', { count: 'exact', head: true })
      .eq('catedra_id', catId)
    console.log(`  Cátedra ${catId}: ${count ?? 'ERROR'} clases ${clErr ? '(Error: ' + clErr.message + ')' : ''}`)
  }

  // 4. Inscripciones
  console.log('\n--- 4. INSCRIPCIONES (count) ---')
  for (const catId of catIds) {
    const { count, error: iErr } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('catedra_id', catId)
    console.log(`  Cátedra ${catId}: ${count ?? 'ERROR'} inscripciones ${iErr ? '(Error: ' + iErr.message + ')' : ''}`)
  }

  // 5. Check perfiles table columns
  console.log('\n--- 5. PERFILES TABLE SAMPLE (1 row) ---')
  const { data: sample } = await supabase
    .from('perfiles')
    .select('*')
    .limit(1)
  if (sample && sample[0]) {
    console.log('Columns:', Object.keys(sample[0]).join(', '))
  }
}

run().catch(console.error)
