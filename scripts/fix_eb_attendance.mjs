import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fix() {
  const catId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  const oldClaseId = '56c7780e-6f2c-46bc-bb67-fa0dce0b08be'

  console.log("Starting fix for Enfermería Basica...")

  // 1. Create the correct classes
  const datesToCreate = ['2026-03-31', '2026-04-01', '2026-04-07']
  const newClases = {}

  for (const date of datesToCreate) {
    console.log(`Creating class for ${date}...`)
    const { data, error } = await supabase
      .from('clases')
      .insert({
        catedra_id: catId,
        fecha: date,
        tipo: 'teorico_practica',
        tema: `Clase del ${date}`,
        estado_clase: 'normal'
      })
      .select()
      .single()
    
    if (error) {
      console.error(`Error creating class ${date}:`, error)
      // Maybe it already exists?
      const { data: existing } = await supabase.from('clases').select('id').eq('catedra_id', catId).eq('fecha', date).single()
      if (existing) {
        newClases[date] = existing.id
      }
    } else {
      newClases[date] = data.id
    }
  }

  // 2. Move asistencias
  const moveData = [
    { from: '2026-03-31T00:00:00Z', to: '2026-03-31T23:59:59Z', newClaseId: newClases['2026-03-31'] },
    { from: '2026-04-01T00:00:00Z', to: '2026-04-01T23:59:59Z', newClaseId: newClases['2026-04-01'] },
    { from: '2026-04-07T00:00:00Z', to: '2026-04-07T23:59:59Z', newClaseId: newClases['2026-04-07'] },
  ]

  for (const m of moveData) {
    if (!m.newClaseId) continue
    console.log(`Moving asistencias from ${m.from.split('T')[0]}...`)
    const { data: toMove, error: fetchErr } = await supabase
      .from('asistencias')
      .select('id')
      .eq('clase_id', oldClaseId)
      .gte('hora_registro', m.from)
      .lte('hora_registro', m.to)

    if (fetchErr) {
       console.error("Error fetching asistencias:", fetchErr)
       continue
    }

    if (toMove.length === 0) {
      console.log(`No asistencias found to move for ${m.from.split('T')[0]}`)
      continue
    }

    console.log(`Found ${toMove.length} asistencias. Updating...`)
    const { error: updateErr } = await supabase
      .from('asistencias')
      .update({ clase_id: m.newClaseId })
      .in('id', toMove.map(a => a.id))

    if (updateErr) {
      console.error("Error updating asistencias:", updateErr)
    } else {
      console.log(`Successfully moved ${toMove.length} asistencias to ${m.newClaseId}`)
    }
  }

  // 3. Rename the old class (2026-03-27) to 2026-03-25 (the first class day)
  // because 2026-03-25 was the actual start date and we have 1 registration there.
  console.log("Renaming March 27 class to March 25...")
  const { error: renameErr } = await supabase
    .from('clases')
    .update({ fecha: '2026-03-25', tema: 'Clase del 2026-03-25' })
    .eq('id', oldClaseId)

  if (renameErr) {
    console.error("Error renaming class:", renameErr)
  } else {
    console.log("Successfully renamed class to 2026-03-25")
  }

  console.log("Fix complete.")
}

fix()
