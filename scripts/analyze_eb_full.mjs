import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const catedraId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  console.log(`\n=== ANÁLISIS DETALLADO: ENFERMERÍA BÁSICA ===`)

  // 1. Obtener todas las clases de esta cátedra
  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', catedraId)
    .order('fecha', { ascending: true })

  console.log(`\nClases encontradas: ${clases.length}`)
  for (const c of clases) {
    // Buscar asistencias para cada clase
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('id, created_at, estado')
      .eq('clase_id', c.id)

    const presentes = asistencias.filter(a => a.estado === 'presente').length
    console.log(`- [${c.id.slice(0,8)}] Fecha: ${c.fecha} | Presentes: ${presentes} | Total: ${asistencias.length}`)
    
    // Ver cuándo se crearon estos registros
    if (asistencias.length > 0) {
      const creations = asistencias.map(a => a.created_at.split('T')[0])
      const creationCounts = {}
      creations.forEach(d => creationCounts[d] = (creationCounts[d] || 0) + 1)
      console.log(`  Creaciones por día: ${JSON.stringify(creationCounts)}`)
    }
  }
}

check().catch(console.error)
