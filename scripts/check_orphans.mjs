import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const catedraId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  
  // 1. Inscriptos
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select('id')
    .eq('catedra_id', catedraId)
  const inscIds = inscripciones.map(i => i.id)

  // 2. Todas sus asistencias
  const { data: asistencias } = await supabase
    .from('asistencias')
    .select('*, clases(fecha, id)')
    .in('inscripcion_id', inscIds)

  console.log(`\nTotal asistencias para esta cátedra: ${asistencias.length}`)

  const byClase = {}
  asistencias.forEach(a => {
    const key = a.clase_id
    if (!byClase[key]) byClase[key] = { count: 0, fecha_clase: a.clases?.fecha || 'HUÉRFANA' }
    byClase[key].count++
  })

  console.log('\nDesglose por clase_id:')
  Object.entries(byClase).forEach(([id, info]) => {
    console.log(`- ID: ${id} | Fecha Clase: ${info.fecha_clase} | Registros: ${info.count}`)
  })
}

check().catch(console.error)
