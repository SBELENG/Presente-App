import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const PRESTI_TARGET_ID = 'a56bc6ec-f239-423d-b4be-886ec4ec1780' // educacacionenenfermeria@hum.unrc.edu.ar
const PRESTI_SOURCE_ID = 'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a' // 5214maternoinf@hum.unrc.edu.ar

const CATEDRA_IDS = [
  '7dee9248-ddfb-4591-b19c-c2cb24f9250d', // Educación en Enfermería
  'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'  // Enfermería Materno Infantil
]

async function fixPresti() {
  console.log('🚀 Iniciando proceso de unificación y limpieza para Prof. Presti...')
  
  for (const cid of CATEDRA_IDS) {
    console.log(`\nProcesando Cátedra: ${cid}`)
    
    // Update docente_id and ensure bloques_semanales is an array
    const { data, error } = await supabase
      .from('catedras')
      .update({ 
        docente_id: PRESTI_TARGET_ID,
        bloques_semanales: [] // Fix potential crash if it was {}
      })
      .eq('id', cid)
      .select()
    
    if (error) {
       console.error(`❌ Error actualizando ${cid}:`, error.message)
    } else {
       console.log(`✅ Cátedra ${data[0]?.nombre} actualizada correctamente.`)
       console.log(`   - Ahora vinculada a: ${PRESTI_TARGET_ID}`)
       console.log(`   - bloques_semanales: ${JSON.stringify(data[0]?.bloques_semanales)}`)
    }
  }

  // Double check if there's anything else in the source account
  const { data: orphans } = await supabase
    .from('catedras')
    .select('id, nombre')
    .eq('docente_id', PRESTI_SOURCE_ID)
  
  if (orphans && orphans.length > 0) {
    console.log(`\n⚠️ Se encontraron otras ${orphans.length} cátedras en la cuenta origen que no fueron procesadas:`)
    orphans.forEach(o => console.log(`- ${o.nombre} (${o.id})`))
  } else {
    console.log('\n✅ La cuenta origen ya no tiene cátedras vinculadas.')
  }

  console.log('\n=== Resumen Final ===')
  const { data: final } = await supabase
    .from('catedras')
    .select('id, nombre, docente_id')
    .eq('docente_id', PRESTI_TARGET_ID)
  
  console.log(`La cuenta unificada (${PRESTI_TARGET_ID}) ahora tiene:`)
  final?.forEach(c => console.log(`- ${c.nombre} (${c.id})`))
}

fixPresti().catch(console.error)
