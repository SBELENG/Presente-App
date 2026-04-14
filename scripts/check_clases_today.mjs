import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  console.log(`\n=== REVISANDO CLASES CREADAS HOY (08/04) ===`)
  const { data: clases } = await supabase
    .from('clases')
    .select('*, catedras(nombre)')
    .gte('created_at', '2026-04-08T00:00:00Z')

  clases.forEach(c => {
    console.log(`- [${c.id.slice(0,8)}] Cátedra: ${c.catedras?.nombre} | Fecha Clase: ${c.fecha} | Creada: ${c.created_at}`)
  })
}

check().catch(console.error)
