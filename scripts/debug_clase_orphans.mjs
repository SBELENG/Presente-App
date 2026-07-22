import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debug() {
  console.log("Checking for orphaned attendances (clase_id not in current clases)...")

  const { data: allAsist } = await supabase.from('asistencias').select('id, clase_id')
  const { data: allClases } = await supabase.from('clases').select('id')

  const claseIds = new Set(allClases.map(c => c.id))
  const orphans = allAsist.filter(a => !claseIds.has(a.clase_id))

  console.log(`Total attendances: ${allAsist.length}`)
  console.log(`Total clases: ${allClases.length}`)
  console.log(`Orphaned attendances (clase_id): ${orphans.length}`)

  if (orphans.length > 0) {
    console.log("Sample orphans (clase_id):", orphans.slice(0, 5))
  }
}

debug().catch(console.error)
