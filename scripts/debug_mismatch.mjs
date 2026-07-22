import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debug() {
  console.log("Checking for cátedra mismatch in attendances...")

  const { data: asistencias } = await supabase
    .from('asistencias')
    .select('id, inscripcion_id, clase_id, inscripciones(catedra_id), clases(catedra_id)')

  const mismatches = asistencias.filter(a => {
    return a.inscripciones?.catedra_id !== a.clases?.catedra_id
  })

  console.log(`Total attendances: ${asistencias.length}`)
  console.log(`Mismatched attendances: ${mismatches.length}`)

  if (mismatches.length > 0) {
    console.log("Sample mismatches:", mismatches.slice(0, 5))
  }
}

debug().catch(console.error)
