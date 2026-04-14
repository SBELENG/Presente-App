import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const catedraId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  console.log(`\n=== TODAS LAS CLASES DE EB (SIN AGRUPAR POR FECHA) ===`)
  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', catedraId)
    .order('created_at', { ascending: true })

  for (const c of clases) {
    const { count } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', c.id)
    
    console.log(`- [${c.id}] Fecha: ${c.fecha} | Creada: ${c.created_at} | Asistencias: ${count}`)
  }
}

check().catch(console.error)
