import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const PRESTI_TARGET_ID = 'a56bc6ec-f239-423d-b4be-886ec4ec1780' // educacacionenenfermeria@hum.unrc.edu.ar
const PRESTI_SOURCE_ID = 'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a' // 5214maternoinf@hum.unrc.edu.ar

async function unifyPresti() {
  console.log(`🚀 Unificando cátedras para la Prof. Presti en el ID: ${PRESTI_TARGET_ID}...`)
  
  // 1. Move Materno Infantil
  const { data: catToMove, error: fetchError } = await supabase
    .from('catedras')
    .select('id, nombre')
    .eq('docente_id', PRESTI_SOURCE_ID)
  
  if (fetchError) {
    console.error('Error buscando cátedras del ID origen:', fetchError.message)
    return
  }

  if (catToMove.length === 0) {
    console.log('No se encontraron cátedras para mover desde el ID origen.')
  } else {
    for (const c of catToMove) {
      console.log(`Moviendo cátedra: ${c.nombre} (${c.id})...`)
      const { error: updateError } = await supabase
        .from('catedras')
        .update({ docente_id: PRESTI_TARGET_ID })
        .eq('id', c.id)
      
      if (updateError) {
        console.error(`❌ Error moviendo ${c.nombre}:`, updateError.message)
      } else {
        console.log(`✅ ${c.nombre} movida con éxito.`)
      }
    }
  }

  // 2. Verify all are now in target
  const { data: allCats } = await supabase
    .from('catedras')
    .select('id, nombre, docente_id')
    .eq('docente_id', PRESTI_TARGET_ID)
  
  console.log('\nCátedras actuales en la cuenta unificada:')
  allCats?.forEach(c => console.log(`- ${c.nombre} (ID: ${c.id})`))
}

unifyPresti().catch(console.error)
