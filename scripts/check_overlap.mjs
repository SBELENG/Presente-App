import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const classIdApril1st = '33daf325-e28b-4485-a68b-a284d91d48be'
  const classIdMarch31st = 'f8d0c242-1efd-4fd9-b77c-eb67ff01c5a2'

  // Los 4 presentes del 1 de abril
  const { data: asist1 } = await supabase
    .from('asistencias')
    .select('inscripcion_id, inscripciones(apellido_estudiante, nombre_estudiante)')
    .eq('clase_id', classIdApril1st)
    .eq('estado', 'presente')

  console.log(`\nEstudiantes presentes el 1/04 (${asist1.length}):`)
  for (const a of asist1) {
    // ¿Tienen registro el 31/03?
    const { data: asist2 } = await supabase
      .from('asistencias')
      .select('id')
      .eq('clase_id', classIdMarch31st)
      .eq('inscripcion_id', a.inscripcion_id)
      .single()

    console.log(`- ${a.inscripciones.apellido_estudiante}, ${a.inscripciones.nombre_estudiante} | ¿Estuvo el 31/03?: ${asist2 ? 'SÍ' : 'NO'}`)
  }
}

check().catch(console.error)
