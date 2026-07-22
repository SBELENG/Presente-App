import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const targetCatedras = [
  'f1f38978-b2cc-428f-8675-6af8be29b93d', // Investigación
  '898780dd-5831-4f57-b376-f540cb241cff', // Salud Comunitaria II
  '7586f85d-a487-4ed8-889c-16511953ec0e'  // Gestión II
]

async function reconcile() {
  console.log("Starting reconciliation for affected cátedras...")

  // 1. Get all attendances in 'pendiente_inscripcion' for these cátedras
  const { data: asistencias, error: asErr } = await supabase
    .from('asistencias')
    .select('*, clases(fecha, catedra_id)')
    .eq('estado', 'pendiente_inscripcion')

  if (asErr) throw asErr

  const filteredAsist = asistencias.filter(a => targetCatedras.includes(a.clases?.catedra_id))
  console.log(`Found ${filteredAsist.length} pending attendances to resolve.`)

  for (const asist of filteredAsist) {
    // Update to 'presente'
    const { error: updErr } = await supabase
      .from('asistencias')
      .update({ estado: 'presente' })
      .eq('id', asist.id)
    
    if (updErr) {
      console.error(`Error updating asistencia ${asist.id}:`, updErr)
    } else {
      console.log(`Resolved: Asistencia ${asist.id} (Clase ${asist.clases?.fecha}) -> PRESENTE`)
    }
  }

  // 2. Also check if there are multiple inscriptions for the same DNI/Catedra
  // and merge them if one is 'pendiente' and has attendances.
  const { data: allInsc } = await supabase.from('inscripciones').select('*').in('catedra_id', targetCatedras)
  const grouped = {}
  allInsc.forEach(i => {
    const key = `${i.dni_estudiante}_${i.catedra_id}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(i)
  })

  for (const key in grouped) {
    const inscs = grouped[key]
    if (inscs.length > 1) {
      console.log(`Found duplicate inscriptions for ${key}:`, inscs.map(i => i.id))
      // Logic to merge: find the one that is NOT 'pendiente' (the official one)
      const official = inscs.find(i => i.estado !== 'pendiente')
      const pendings = inscs.filter(i => i.estado === 'pendiente')

      if (official && pendings.length > 0) {
        for (const p of pendings) {
          console.log(`Merging ${p.id} into official ${official.id}...`)
          // Move attendances
          const { error: moveErr } = await supabase
            .from('asistencias')
            .update({ inscripcion_id: official.id, estado: 'presente' })
            .eq('inscripcion_id', p.id)
          
          if (moveErr) {
            console.error(`Error moving attendances from ${p.id}:`, moveErr)
          } else {
            // Delete the pending inscription
            const { error: delErr } = await supabase.from('inscripciones').delete().eq('id', p.id)
            if (delErr) console.error(`Error deleting pending insc ${p.id}:`, delErr)
          }
        }
      }
    }
  }

  console.log("Reconciliation finished.")
}

reconcile().catch(console.error)
