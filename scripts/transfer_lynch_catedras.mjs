import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const GABRIELA_NEW_ID = '1dfbaa19-8386-43eb-b68c-723c35675baf'
const CATEDRA_IDS = [
  '7586f85d-a487-4ed8-889c-16511953ec0e', // Gestión y Desarrollo II
  '3ba39d75-b1bb-4e29-84bc-6c05525f2bdc', // Taller de trabajo final
]

async function transferCatedras() {
  console.log(`🚀 Iniciando transferencia de cátedras para Gabriela Lynch (${GABRIELA_NEW_ID})...`)
  
  for (const id of CATEDRA_IDS) {
    console.log(`Updating catedra ${id}...`)
    const { data, error } = await supabase
      .from('catedras')
      .update({ docente_id: GABRIELA_NEW_ID })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error(`❌ Error actualizando ${id}:`, error.message)
    } else {
      console.log(`✅ Cátedra ${id} actualizada con éxito!`)
      console.log('   Data:', data[0]?.nombre)
    }
  }
}

transferCatedras()
