import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  console.log(`\n=== REVISANDO ASISTENCIAS CREADAS ENTRE 31/03 Y 03/04 ===`)

  const { data: asistencias, error } = await supabase
    .from('asistencias')
    .select('*, clases(fecha, catedras(nombre))')
    .gte('created_at', `2026-03-31T00:00:00Z`)
    .lt('created_at', `2026-04-04T00:00:00Z`)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total asistencias creadas ese día: ${asistencias.length}`)

  const summary = {}
  for (const a of asistencias) {
    const catedraNombre = a.clases?.catedras?.nombre || 'Desconocida'
    const claseFecha = a.clases?.fecha || 'Desconocida'
    const creationFecha = a.created_at.split('T')[0]
    const key = `${catedraNombre} | Clase: ${claseFecha} | Creado: ${creationFecha}`
    summary[key] = (summary[key] || 0) + 1
  }

  console.log('\nResumen Detallado:')
  Object.entries(summary).sort().forEach(([key, count]) => {
    console.log(`  - ${key}: ${count} registros`)
  })
}

check().catch(console.error)
