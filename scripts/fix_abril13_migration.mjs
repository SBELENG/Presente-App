import { createClient } from '@supabase/supabase-js'

// ==============================================================
// SCRIPT DE MIGRACIÓN: Corrige asistencias del 13/04/2026
// Situación: Los alumnos escanearon el QR del 28/03 el día 13/04
// El QR inteligente intentó redirigir pero no pudo crear clase nueva
// → Las asistencias quedaron guardadas en clase erronea (28/03)
//
// FIX:
//   1. Crear clase nueva con fecha 2026-04-13
//   2. Mover las 17 asistencias "presente" del 13/04 a la clase nueva
//   3. Mover las asistencias "pendiente_inscripcion" también
//   4. Actualizar clase del 14/04 → campo fecha a 2026-04-13 
//      (no tiene asistencias, era la creada por la tarde del prof)
// ==============================================================

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEDRA_ID    = '898780dd-5831-4f57-b376-f540cb241cff'
const CLASE_28MAR   = 'fda92023-da06-40e5-bd18-59d4cc0feab0'
const CLASE_14ABR   = 'de85280b-97bd-4805-9e0e-953afc74a6b3' // 0 asistencias, fecha errónea
const FECHA_CORRECTA = '2026-04-13'

async function migrate() {
  console.log('=== MIGRACIÓN ASISTENCIAS 13/04 ===\n')

  // ----------------------------------------------------------
  // PASO 1: Usar la clase del "14/04" (que tiene 0 asistencias)
  // y cambiarle la fecha a 2026-04-13 — ES LA CLASE CORRECTA DEL DÍA
  // ----------------------------------------------------------
  console.log('PASO 1: Reutilizar clase de 14/04 corrigiendo su fecha a 13/04...')
  const { error: updateErr } = await supabase
    .from('clases')
    .update({ 
      fecha: FECHA_CORRECTA,
      tema: `Clase del ${FECHA_CORRECTA}`
    })
    .eq('id', CLASE_14ABR)
  
  if (updateErr) {
    console.log(`  ⚠️  No se pudo actualizar via anon (RLS). Se necesita SQL directo.`)
    console.log(`  SQL A EJECUTAR EN SUPABASE:\n`)
    console.log(`  UPDATE clases SET fecha = '${FECHA_CORRECTA}', tema = 'Clase del ${FECHA_CORRECTA}'`)
    console.log(`  WHERE id = '${CLASE_14ABR}';\n`)
  } else {
    console.log(`  ✅ Clase actualizada: fecha → ${FECHA_CORRECTA}`)
  }

  // ----------------------------------------------------------
  // PASO 2: Identificar qué asistencias del 13/04 están en  
  // la clase del 28/03 y necesitan moverse
  // ----------------------------------------------------------
  console.log('\nPASO 2: Identificando asistencias del 13/04 en clase del 28/03...')
  
  const { data: asistAMover } = await supabase
    .from('asistencias')
    .select('id, inscripcion_id, estado, created_at')
    .eq('clase_id', CLASE_28MAR)
    .gte('created_at', '2026-04-13T00:00:00Z')
    .lt('created_at',  '2026-04-14T03:00:00Z') // hasta medianoche ART
    .order('created_at')

  console.log(`  Encontradas: ${asistAMover?.length ?? 0} asistencias para mover`)
  asistAMover?.forEach(a => {
    console.log(`  - ID: ${a.id} | insc: ${a.inscripcion_id?.slice(0,8)} | ${a.estado} | ${a.created_at}`)
  })

  if (!asistAMover || asistAMover.length === 0) {
    console.log('  No hay nada que mover.')
    return
  }

  // ----------------------------------------------------------
  // PASO 3: Mover asistencias a la clase correcta (13/04)
  // En Supabase anon, UPDATE en asistencias puede estar bloqueado
  // Generamos el SQL por si acaso
  // ----------------------------------------------------------
  console.log('\nPASO 3: Moviendo asistencias a clase del 13/04...')
  
  let exitosos = 0
  let fallidos = []
  
  for (const asist of asistAMover) {
    const { error } = await supabase
      .from('asistencias')
      .update({ clase_id: CLASE_14ABR }) // ya corregida a 13/04 en paso 1
      .eq('id', asist.id)
    
    if (error) {
      fallidos.push(asist.id)
    } else {
      exitosos++
    }
  }

  console.log(`  ✅ Movidas exitosamente: ${exitosos}`)
  
  if (fallidos.length > 0) {
    console.log(`\n  ⚠️  ${fallidos.length} no pudieron actualizarse via anon.`)
    console.log(`  SQL A EJECUTAR EN SUPABASE:\n`)
    const ids = asistAMover.map(a => `'${a.id}'`).join(',\n      ')
    console.log(`  UPDATE asistencias`)
    console.log(`  SET clase_id = '${CLASE_14ABR}'`)
    console.log(`  WHERE id IN (`)
    console.log(`    ${ids}`)
    console.log(`  );\n`)
    
    // También mostrar SQL para limpiar el 28/03 
    // (para que no figure como "presente" en esa clase)
    console.log(`  -- Verificación post-migración:`)
    console.log(`  SELECT a.id, a.estado, a.created_at, i.nombre_estudiante, i.apellido_estudiante`)
    console.log(`  FROM asistencias a`)
    console.log(`  JOIN inscripciones i ON i.id = a.inscripcion_id`)
    console.log(`  WHERE a.clase_id = '${CLASE_14ABR}'`)
    console.log(`  ORDER BY a.created_at;`)
  }

  // ----------------------------------------------------------
  // PASO 4: Verificación final
  // ----------------------------------------------------------
  console.log('\nPASO 4: Verificación final...')
  
  const { count: count28 } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .eq('clase_id', CLASE_28MAR)
    .gte('created_at', '2026-04-13T00:00:00Z')

  const { count: count13 } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .eq('clase_id', CLASE_14ABR) // ahora es clase del 13/04

  console.log(`  Clase 28/03 - asistencias del 13/04 restantes: ${count28}`)
  console.log(`  Clase 13/04 - asistencias totales: ${count13}`)
  
  if (count28 === 0 && count13 === asistAMover.length) {
    console.log('\n✅ MIGRACIÓN COMPLETADA CON ÉXITO')
  } else {
    console.log('\n⚠️  Ejecutar el SQL manual en Supabase Dashboard para completar la migración')
  }
}

migrate().catch(console.error)
