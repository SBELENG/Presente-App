import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkCatedras() {
  const { data: catedras } = await supabase
    .from('catedras')
    .select('id, nombre, docente_id, created_at')
    .order('created_at', { ascending: false })
  
  console.log("All Cátedras and their Docente IDs:")
  catedras.forEach(c => {
    console.log(`- ${c.nombre} (${c.id}) | Docente: ${c.docente_id} | Created: ${c.created_at}`)
  })
}

checkCatedras()
