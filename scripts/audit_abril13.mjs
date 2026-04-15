import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEDRA_ID = '898780dd-5831-4f57-b376-f540cb241cff'
const CLASE_6_ABR  = 'bf0c4aac-...' // placeholder, buscaremos abajo

async function audit() {
  // 1. Traer TODAS las clases de la cátedra con sus asistencias
  const { data: clases } = await supabase
    .from('clases')
    .select('id, fecha, estado_clase, created_at')
    .eq('catedra_id', CATEDRA_ID)
    .order('fecha')

  console.log('\n=== TODAS LAS CLASES (con conteo de asistencias) ===')
  for (const c of clases) {
    const { count } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', c.id)
    
    const { count: countPresente } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', c.id)
      .eq('estado', 'presente')

    // Chequear si hay inserciones en el rango 13/04
    const { data: asist13 } = await supabase
      .from('asistencias')
      .select('id, estado, created_at, inscripcion_id')
      .eq('clase_id', c.id)
      .gte('created_at', '2026-04-13T00:00:00Z')
      .lt('created_at',  '2026-04-14T03:00:00Z')  // hasta la medianoche AR
    
    const { data: asist14 } = await supabase
      .from('asistencias')
      .select('id, estado, created_at, inscripcion_id')
      .eq('clase_id', c.id)
      .gte('created_at', '2026-04-14T03:00:00Z')
      .lt('created_at',  '2026-04-15T03:00:00Z')

    console.log(`\n  [${c.fecha}] ID: ${c.id}`)
    console.log(`    created_at DB: ${c.created_at}`)
    console.log(`    Total asistencias: ${count} (presentes: ${countPresente})`)
    console.log(`    → Registradas el 13/04 (ART): ${asist13?.length ?? 0}`)
    console.log(`    → Registradas el 14/04 (ART): ${asist14?.length ?? 0}`)
    
    if (asist13?.length > 0) {
      console.log(`    *** DETALLE 13/04 ***`)
      for (const a of asist13) {
        const { data: insc } = await supabase
          .from('inscripciones')
          .select('nombre_estudiante, apellido_estudiante')
          .eq('id', a.inscripcion_id)
          .single()
        console.log(`      - ${insc?.nombre_estudiante} ${insc?.apellido_estudiante} | ${a.estado} | ${a.created_at}`)
      }
    }
    if (asist14?.length > 0) {
      console.log(`    *** DETALLE 14/04 ***`)
      for (const a of asist14) {
        const { data: insc } = await supabase
          .from('inscripciones')
          .select('nombre_estudiante, apellido_estudiante')
          .eq('id', a.inscripcion_id)
          .single()
        console.log(`      - ${insc?.nombre_estudiante} ${insc?.apellido_estudiante} | ${a.estado} | ${a.created_at}`)
      }
    }
  }

  // 2. Verificar si hay asistencias "huérfanas" con inscripcion de esta cátedra
  //    pero en clases NO listadas (edge case)
  console.log('\n=== BÚSQUEDA DE ASISTENCIAS HUÉRFANAS (13-14 ABR) ===')
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select('id, nombre_estudiante, apellido_estudiante')
    .eq('catedra_id', CATEDRA_ID)

  let encontradas = 0
  for (const insc of inscripciones) {
    const { data: asistRango } = await supabase
      .from('asistencias')
      .select('id, estado, created_at, clase_id')
      .eq('inscripcion_id', insc.id)
      .gte('created_at', '2026-04-13T00:00:00Z')
      .lt('created_at',  '2026-04-15T03:00:00Z')
    
    if (asistRango && asistRango.length > 0) {
      encontradas++
      console.log(`  ${insc.nombre_estudiante} ${insc.apellido_estudiante}:`)
      asistRango.forEach(a => {
        const claseInfo = clases.find(c => c.id === a.clase_id)
        console.log(`    clase_id: ${a.clase_id} (fecha DB: ${claseInfo?.fecha ?? 'DESCONOCIDA'}) | ${a.estado} | ${a.created_at}`)
      })
    }
  }
  if (encontradas === 0) console.log('  → Ninguna asistencia encontrada para inscriptos de esta cátedra en 13-14 abr')
}

audit().catch(console.error)
