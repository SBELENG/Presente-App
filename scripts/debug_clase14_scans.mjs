import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function investigate() {
  const CATEDRA_ID = '898780dd-5831-4f57-b376-f540cb241cff'

  // 1. Traer TODAS las clases de la cátedra para no perdernos ninguna
  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', CATEDRA_ID)
    .order('created_at', { ascending: true })

  console.log('\n=== TODAS LAS CLASES DE LA CÁTEDRA ===')
  clases?.forEach(c => {
    console.log(`  [${c.id.slice(0,8)}] fecha DB: ${c.fecha} | estado: ${c.estado_clase} | qr_activo: ${c.qr_activo} | created_at: ${c.created_at} | qr_id: ${c.qr_id?.slice(0,8) ?? 'null'}`)
  })

  // 2. Clase del 14 de abril
  const clase14 = clases?.find(c => c.fecha === '2026-04-14')
  if (!clase14) {
    console.log('\n❌ No encontre clase del 14/04')
    return
  }

  console.log(`\n=== CLASE 14/04 → ID: ${clase14.id} ===`)
  console.log(`   created_at (cuándo fue creada): ${clase14.created_at}`)

  // 3. Todas las asistencias de esa clase CON timestamp de creación
  const { data: asistencias } = await supabase
    .from('asistencias')
    .select('*, inscripciones(nombre_estudiante, apellido_estudiante)')
    .eq('clase_id', clase14.id)
    .order('created_at', { ascending: true })

  console.log(`\n=== ASISTENCIAS DE LA CLASE 14/04 (${asistencias?.length ?? 0} registros) ===`)
  console.log('(IMPORTANTE: fijarse los que tienen created_at con fecha 13/04)\n')

  const del13 = []
  const del14 = []

  asistencias?.forEach(a => {
    const nombre = `${a.inscripciones?.nombre_estudiante ?? '?'} ${a.inscripciones?.apellido_estudiante ?? '?'}`
    // Convertir a hora Argentina (UTC-3)
    const fechaUTC = new Date(a.created_at)
    const offsetAR = -3 * 60
    const fechaAR = new Date(fechaUTC.getTime() + offsetAR * 60000)
    const diaAR = fechaAR.toISOString().split('T')[0]
    const horaAR = fechaAR.toISOString().split('T')[1].slice(0,8)
    const esDelDia13 = diaAR === '2026-04-13'

    const linea = `  ${esDelDia13 ? '⚠️ DÍA 13!' : '✅'} ${nombre.padEnd(35)} → ${a.estado} | Escaneado: ${diaAR} ${horaAR} ART`
    console.log(linea)

    if (esDelDia13) del13.push({ nombre, estado: a.estado, hora: horaAR, id: a.id, insc_id: a.inscripcion_id })
    else del14.push({ nombre, estado: a.estado, hora: horaAR })
  })

  console.log(`\n--- RESUMEN ---`)
  console.log(`  Escaneados el 13/04 (AR): ${del13.length}`)
  console.log(`  Escaneados el 14/04 (AR): ${del14.length}`)

  if (del13.length > 0) {
    console.log('\n⚠️ ESTOS ALUMNOS ESCANEARON EL 13/04 PERO ESTÁN EN LA CLASE DEL 14/04:')
    del13.forEach(a => console.log(`  - ${a.nombre} → ${a.estado} a las ${a.hora}`))
  }

  // 4. Buscar específicamente a Belén
  const belen13 = del13.filter(a => 
    a.nombre.toLowerCase().includes('belen') || 
    a.nombre.toLowerCase().includes('belén')
  )
  const belen14 = del14.filter(a =>
    a.nombre.toLowerCase().includes('belen') || 
    a.nombre.toLowerCase().includes('belén')
  )

  console.log('\n=== BÚSQUEDA ESPECÍFICA DE BELÉN ===')
  if (belen13.length > 0) {
    console.log('✅ Belén TIene registro escaneado el 13/04 (en clase del 14):')
    belen13.forEach(a => console.log(`   ${JSON.stringify(a)}`))
  } else if (belen14.length > 0) {
    console.log('ℹ️ Belén tiene registro, pero escaneado el 14/04:')
    belen14.forEach(a => console.log(`   ${JSON.stringify(a)}`))
  } else {
    console.log('❌ Belén NO aparece en ningún registro de la clase del 14/04')
    
    // Buscar en inscripciones directamente
    const { data: inscBelen } = await supabase
      .from('inscripciones')
      .select('id, nombre_estudiante, apellido_estudiante')
      .eq('catedra_id', CATEDRA_ID)
      .or('nombre_estudiante.ilike.%belen%,nombre_estudiante.ilike.%belén%,apellido_estudiante.ilike.%belen%')

    if (inscBelen && inscBelen.length > 0) {
      console.log('\n🔍 Belén está inscripta como:')
      inscBelen.forEach(i => console.log(`   ${i.nombre_estudiante} ${i.apellido_estudiante} (insc: ${i.id})`))

      // Buscar sus asistencias en CUALQUIER clase de la cátedra
      const { data: clasesIds } = await supabase
        .from('clases').select('id, fecha').eq('catedra_id', CATEDRA_ID)
      
      for (const insc of inscBelen) {
        const { data: asistBelen } = await supabase
          .from('asistencias')
          .select('*')
          .eq('inscripcion_id', insc.id)
          .in('clase_id', clasesIds.map(c => c.id))
        
        console.log(`\n   Asistencias de ${insc.nombre_estudiante} ${insc.apellido_estudiante}:`)
        if (asistBelen && asistBelen.length > 0) {
          asistBelen.forEach(a => {
            const claseInfo = clasesIds.find(c => c.id === a.clase_id)
            console.log(`     Clase fecha ${claseInfo?.fecha}: ${a.estado} | created_at: ${a.created_at}`)
          })
        } else {
          console.log('     Sin ningún registro de asistencia')
        }
      }
    } else {
      console.log('\n❌ Tampoco hay inscripción de Belén en esta cátedra')
    }
  }

  // 5. Revisar si hay alguna clase del 13/04 en CUALQUIER cátedra con scans del 13/04
  console.log('\n=== VERIFICACIÓN EXTRA: ¿Existe alguna clase del 13/04 en el sistema? ===')
  const { data: clases13Todas } = await supabase
    .from('clases')
    .select('id, fecha, catedra_id, created_at, estado_clase')
    .eq('fecha', '2026-04-13')

  if (clases13Todas && clases13Todas.length > 0) {
    console.log('Clases con fecha 13/04 en todo el sistema:')
    clases13Todas.forEach(c => console.log(`  [${c.id.slice(0,8)}] catedra: ${c.catedra_id.slice(0,8)} | estado: ${c.estado_clase} | created_at: ${c.created_at}`))
  } else {
    console.log('❌ No hay NINGUNA clase con fecha 13/04 en todo el sistema')
  }
}

investigate().catch(console.error)
