import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debug() {
  console.log("Checking for multiple inscriptions or orphaned attendances...")

  // 1. Find all attendances that might be orphaned (inscripcion_id not in current inscripciones)
  const { data: allAsist } = await supabase.from('asistencias').select('id, inscripcion_id, clase_id')
  const { data: allInsc } = await supabase.from('inscripciones').select('id, dni_estudiante, catedra_id')

  const inscIds = new Set(allInsc.map(i => i.id))
  const orphans = allAsist.filter(a => !inscIds.has(a.inscripcion_id))

  console.log(`Total attendances: ${allAsist.length}`)
  console.log(`Total inscriptions: ${allInsc.length}`)
  console.log(`Orphaned attendances: ${orphans.length}`)

  if (orphans.length > 0) {
    console.log("Sample orphans:", orphans.slice(0, 5))
  }

  // 2. Check for duplicate inscriptions (same DNI, same Catedra)
  const dupMap = {}
  allInsc.forEach(i => {
    const key = `${i.dni_estudiante}-${i.catedra_id}`
    if (!dupMap[key]) dupMap[key] = []
    dupMap[key].push(i.id)
  })

  const duplicates = Object.entries(dupMap).filter(([k, ids]) => ids.length > 1)
  console.log(`Duplicate inscriptions (DNI-Catedra): ${duplicates.length}`)

  if (duplicates.length > 0) {
    duplicates.forEach(([key, ids]) => {
      console.log(`- Key: ${key} | IDs: ${ids.join(', ')}`)
    })
  }
}

debug().catch(console.error)
