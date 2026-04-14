import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const catedraId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  console.log(`\n=== BUSCANDO ASISTENCIAS DE ESTUDIANTES DE EB CREADAS EL 1 DE ABRIL ===`)

  // 1. Obtener todos los IDs de inscripciones de EB
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select('id')
    .eq('catedra_id', catedraId)

  const inscIds = inscripciones.map(i => i.id)

  // 2. Buscar asistencias creadas en cualquier momento para estas inscripciones
  const { data: asistencias } = await supabase
    .from('asistencias')
    .select('*, clases(fecha, id)')
    .in('inscripcion_id', inscIds)
    .gte('created_at', '2026-03-20T00:00:00Z')
    .lt('created_at', '2026-04-09T00:00:00Z')

  console.log(`Total asistencias encontradas: ${asistencias.length}`)
  
  const summary = {}
  asistencias.forEach(a => {
    const key = a.clases?.fecha || 'Desconocida'
    summary[key] = (summary[key] || 0) + 1
  })

  console.log('Distribución por fecha de clase:')
  console.log(JSON.stringify(summary, null, 2))
}

check().catch(console.error)
