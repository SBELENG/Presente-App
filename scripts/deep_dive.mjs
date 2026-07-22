import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debug() {
  const affectedCatedras = [
    'f1f38978-b2cc-428f-8675-6af8be29b93d', // Investigación
    '898780dd-5831-4f57-b376-f540cb241cff', // Salud Comunitaria II
    '7586f85d-a487-4ed8-889c-16511953ec0e'  // Gestión II
  ]

  const { data: allAsist } = await supabase.from('asistencias').select('id, inscripcion_id, clase_id, clases(fecha, catedra_id)')
  const { data: allInsc } = await supabase.from('inscripciones').select('id, dni_estudiante, catedra_id')
  const inscMap = new Map(allInsc.map(i => [i.id, i]))
  
  const orphans = allAsist.filter(a => !inscMap.has(a.inscripcion_id))
  
  console.log(`Found ${orphans.length} total orphaned attendances.`)

  const relevantOrphans = orphans.filter(o => affectedCatedras.includes(o.clases?.catedra_id))
  console.log(`Found ${relevantOrphans.length} relevant orphans for the affected subjects.`)

  relevantOrphans.forEach(o => {
    console.log(`- Orphan ID: ${o.id} | Clase: ${o.clases?.fecha} (${o.clases?.catedra_id}) | Old Insc ID: ${o.inscripcion_id}`)
  })

  // Check the DNIs provided by the user
  const targetDnis = ['32495514', '26925641', '39071668', '28116496', '45838806', '46036897', '46399232']
  console.log("\nChecking current status of target students:")
  
  for (const dni of targetDnis) {
    const studentInscs = allInsc.filter(i => i.dni_estudiante === dni && affectedCatedras.includes(i.catedra_id))
    console.log(`DNI ${dni}: Found ${studentInscs.length} current inscriptions.`)
    for (const insc of studentInscs) {
      const studentAsist = allAsist.filter(a => a.inscripcion_id === insc.id)
      console.log(`  - Catedra ${insc.catedra_id}: ${studentAsist.length} attendances. Dates: ${studentAsist.map(a => a.clases?.fecha).join(', ')}`)
    }
  }
}

debug().catch(console.error)
