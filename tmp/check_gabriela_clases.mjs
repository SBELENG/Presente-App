import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEDRA_IDS = [
  '7586f85d-a487-4ed8-889c-16511953ec0e', // Gestión II
  '3ba39d75-b1bb-4e29-84bc-6c05525f2bdc', // Taller
]

async function checkClases() {
  for (const id of CATEDRA_IDS) {
    const { data: clases } = await supabase
      .from('clases')
      .select('id, fecha, tema')
      .eq('catedra_id', id)
      .order('fecha', { ascending: false })
      .limit(3)
    
    console.log(`\n--- Clases para cátedra ${id} ---`)
    console.log(clases)
  }
}

checkClases()
