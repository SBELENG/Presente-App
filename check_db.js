import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const catedraId = 'e8814d50-b93d-41c0-9ccc-6529c65f3e4f'
  const dni = '21013427'

  console.log('--- CATEDRA ---')
  const { data: catedra } = await supabase.from('catedras').select('id, nombre, fecha_inicio, fecha_fin, dias_clase, tipo_clase').eq('id', catedraId).single()
  console.log(catedra)

  console.log('\n--- CLASES ---')
  const { data: clases } = await supabase.from('clases').select('id, fecha, estado_clase, tipo').eq('catedra_id', catedraId).order('fecha')
  console.log(clases)

  console.log('\n--- INSCRIPCION ---')
  const { data: insc } = await supabase.from('inscripciones').select('id, dni_estudiante').eq('catedra_id', catedraId).eq('dni_estudiante', dni).single()
  console.log(insc)

  if (insc) {
    console.log('\n--- ASISTENCIAS ---')
    const { data: asist } = await supabase.from('asistencias').select('clase_id, estado').eq('inscripcion_id', insc.id)
    console.log(asist)
  }
}

run().catch(console.error)
