import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEDRA_ID = '898780dd-5831-4f57-b376-f540cb241cff'

async function check() {
  console.log('\n=== ANÁLISIS COMPLETO DE ESCANEOS DEL 13/04 ===\n')

  // 1. Todas las clases de la cátedra
  const { data: clases } = await supabase
    .from('clases')
    .select('id, fecha')
    .eq('catedra_id', CATEDRA_ID)

  console.log(`Clases en la cátedra: ${clases?.map(c => c.fecha).join(', ')}`)

  // 2. ¿Hay asistencias con inscripcion_id de esta cátedra guardadas
  //    en clases de OTRAS cátedras? (edge case crítico)
  const { data: inscripciones } = await supabase
    .from('inscripciones')
    .select('id')
    .eq('catedra_id', CATEDRA_ID)

  const inscIds = inscripciones.map(i => i.id)
  console.log(`Inscriptos en la cátedra: ${inscIds.length}`)

  // Búsqueda amplia: asistencias de CUALQUIER alumno de esta cátedra
  // en el día 13 completo, sin importar en qué clase_id cayeron
  const { data: todasAsist13 } = await supabase
    .from('asistencias')
    .select('id, clase_id, estado, created_at, inscripcion_id')
    .in('inscripcion_id', inscIds)
    .gte('created_at', '2026-04-13T00:00:00Z')
    .lt('created_at',  '2026-04-14T03:00:00Z')
    .order('created_at')

  console.log(`\n📋 Asistencias del 13/04 de alumnos de esta cátedra (en CUALQUIER clase): ${todasAsist13?.length ?? 0}`)
  
  // Agrupar por clase_id para ver si hay dispersión
  const porClase = {}
  todasAsist13?.forEach(a => {
    if (!porClase[a.clase_id]) porClase[a.clase_id] = []
    porClase[a.clase_id].push(a)
  })

  for (const [claseId, regs] of Object.entries(porClase)) {
    const claseInfo = clases?.find(c => c.id === claseId)
    const esPropia = !!claseInfo
    console.log(`\n  clase_id: ${claseId}`)
    console.log(`  fecha DB: ${claseInfo?.fecha ?? '⚠️ CLASE DE OTRA CÁTEDRA'}  ${esPropia ? '(propia)' : ''}`)
    console.log(`  registros: ${regs.length}`)
    if (!esPropia) {
      // Identificar de qué cátedra es esa clase
      const { data: claseAjena } = await supabase
        .from('clases')
        .select('fecha, catedra_id, catedras(nombre)')
        .eq('id', claseId)
        .single()
      console.log(`  → PERTENECE A: ${claseAjena?.catedras?.nombre ?? 'desconocida'} (${claseAjena?.fecha})`)
    }
  }

  // 3. Timing del escaneo - ¿cuándo empezó y cuándo terminó?
  if (todasAsist13?.length > 0) {
    const primera = todasAsist13[0].created_at
    const ultima  = todasAsist13[todasAsist13.length - 1].created_at
    const durMin  = Math.round((new Date(ultima) - new Date(primera)) / 60000)
    console.log(`\n⏱️  Ventana de escaneo: ${new Date(primera).toLocaleTimeString('es-AR', {timeZone:'America/Argentina/Buenos_Aires'})} → ${new Date(ultima).toLocaleTimeString('es-AR', {timeZone:'America/Argentina/Buenos_Aires'})} (${durMin} minutos)`)
    console.log(`    Total registrado: ${todasAsist13.length} alumnos`)
    console.log(`    Presentes:        ${todasAsist13.filter(a => a.estado === 'presente').length}`)
    console.log(`    Pendientes:       ${todasAsist13.filter(a => a.estado === 'pendiente_inscripcion').length}`)
  }

  // 4. ¿Hubo intentos FALLIDOS? Buscar en otras tablas si existe log de errores
  // Verificar si la clase del 28/03 coincidía con el QR que circuló
  // (¿cuántas asistencias PREVIAS tiene del 28/03?)
  const CLASE_28 = 'fda92023-da06-40e5-bd18-59d4cc0feab0'
  const { count: asist28Original } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .eq('clase_id', CLASE_28)
    .lt('created_at', '2026-04-13T00:00:00Z') // solo las del 28/03 real

  console.log(`\n📌 Asistencias originales de la clase 28/03 (antes del 13/04): ${asist28Original}`)
  console.log(`   Esto confirma cuántos alumnos usaron el sistema ese día.`)

  console.log(`\n=== CONCLUSIÓN ===`)
  console.log(`Si el número total del 13/04 es bajo, las causas probables son:`)
  console.log(`  A) La ventana de QR estuvo abierta poco tiempo`)
  console.log(`  B) Parte de los alumnos no pudo escanear (error de red, pantalla de error)`)
  console.log(`  C) Algunos alumnos presentes no usaron el sistema ese día`)
}

check().catch(console.error)
