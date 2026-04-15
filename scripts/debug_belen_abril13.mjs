import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function investigate() {
  // 1. Buscar la cátedra "Enfermería en Salud Comunitaria II"
  const { data: catedras, error: errCat } = await supabase
    .from('catedras')
    .select('*')
    .ilike('nombre', '%Salud Comunitaria II%')

  if (errCat) { console.error('Error catedras:', errCat); return }

  if (!catedras || catedras.length === 0) {
    console.log('❌ No se encontró cátedra con "Salud Comunitaria II"')
    console.log('\n🔍 Buscando todas las cátedras disponibles...')
    const { data: todas } = await supabase.from('catedras').select('id, nombre, docente_id')
    todas?.forEach(c => console.log(`  [${c.id.slice(0,8)}] ${c.nombre}`))
    return
  }

  const cat = catedras[0]
  console.log(`\n✅ CÁTEDRA ENCONTRADA: "${cat.nombre}"`)
  console.log(`   ID: ${cat.id}`)
  console.log(`   Docente ID: ${cat.docente_id}`)
  console.log(`   Inicio: ${cat.fecha_inicio} | Fin: ${cat.fecha_fin}`)
  console.log(`   Días clase: ${JSON.stringify(cat.dias_clase)}`)

  // 2. Buscar la clase del 13 de abril
  const fechaTarget = '2026-04-13'
  const { data: clases13, error: errC } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', cat.id)
    .eq('fecha', fechaTarget)

  console.log(`\n=== CLASE DEL ${fechaTarget} ===`)
  if (errC) { console.error('Error clases:', errC) }
  
  if (!clases13 || clases13.length === 0) {
    console.log(`❌ NO hay registro de clase para el ${fechaTarget}`)
    console.log('\n🔍 Verificando si hay clases cercanas...')
    const { data: clasesRecientes } = await supabase
      .from('clases')
      .select('*')
      .eq('catedra_id', cat.id)
      .gte('fecha', '2026-04-01')
      .order('fecha', { ascending: true })
    
    if (clasesRecientes && clasesRecientes.length > 0) {
      console.log(`   Clases de abril registradas:`)
      clasesRecientes.forEach(c => {
        console.log(`   [${c.id.slice(0,8)}] Fecha: ${c.fecha} | Estado: ${c.estado_clase} | QR: ${c.qr_activo ? 'ACTIVO' : 'inactivo'}`)
      })
    } else {
      console.log('   Ninguna clase registrada en abril.')
    }
  } else {
    const clase = clases13[0]
    console.log(`✅ Clase encontrada: ID=${clase.id}`)
    console.log(`   Estado: ${clase.estado_clase}`)
    console.log(`   QR activo: ${clase.qr_activo}`)
    console.log(`   QR ID: ${clase.qr_id}`)
    console.log(`   created_at: ${clase.created_at}`)

    // 3. Buscar inscripciones en la cátedra con "Belen" o "Belén"
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('catedra_id', cat.id)

    console.log(`\n=== INSCRIPCIONES EN LA CÁTEDRA (${inscripciones?.length ?? 0} total) ===`)
    
    const belenInsc = inscripciones?.filter(i => 
      (i.nombre_estudiante || '').toLowerCase().includes('belen') ||
      (i.nombre_estudiante || '').toLowerCase().includes('belén') ||
      (i.apellido_estudiante || '').toLowerCase().includes('belen') ||
      (i.apellido_estudiante || '').toLowerCase().includes('belén')
    )

    if (belenInsc && belenInsc.length > 0) {
      console.log(`\n🎯 BELÉN(ES) ENCONTRADAS:`)
      for (const insc of belenInsc) {
        console.log(`\n  Nombre: ${insc.nombre_estudiante} ${insc.apellido_estudiante}`)
        console.log(`  Inscripción ID: ${insc.id}`)
        console.log(`  Alumno ID: ${insc.alumno_id}`)

        // 4. Verificar asistencia en esa clase
        const { data: asist } = await supabase
          .from('asistencias')
          .select('*')
          .eq('inscripcion_id', insc.id)
          .eq('clase_id', clase.id)

        if (asist && asist.length > 0) {
          console.log(`  ✅ REGISTRO DE ASISTENCIA ENCONTRADO:`)
          asist.forEach(a => {
            console.log(`     Estado: ${a.estado} | created_at: ${a.created_at} | scan_method: ${a.scan_method || 'N/A'}`)
          })
        } else {
          console.log(`  ❌ NO HAY REGISTRO DE ASISTENCIA para esta clase`)
        }

        // 5. Verificar qr_scans si existe
        const { data: scans } = await supabase
          .from('qr_scans')
          .select('*')
          .eq('clase_id', clase.id)
          .eq('inscripcion_id', insc.id)

        if (scans && scans.length > 0) {
          console.log(`  📱 QR SCANS ENCONTRADOS:`)
          scans.forEach(s => console.log(`     ${JSON.stringify(s)}`))
        } else {
          console.log(`  📱 No hay qr_scans directos para Belén`)
        }
      }
    } else {
      console.log(`⚠️ No se encontró ninguna "Belén" en las inscripciones.`)
      console.log('\nPrimeras 10 inscripciones:')
      inscripciones?.slice(0, 10).forEach(i => {
        console.log(`  ${i.nombre_estudiante} ${i.apellido_estudiante} | ID: ${i.id.slice(0,8)}`)
      })
    }

    // 6. Mostrar todas las asistencias registradas para esa clase
    const { data: todasAsist } = await supabase
      .from('asistencias')
      .select('*, inscripciones(nombre_estudiante, apellido_estudiante)')
      .eq('clase_id', clase.id)

    console.log(`\n=== ASISTENCIAS REGISTRADAS PARA EL ${fechaTarget} (${todasAsist?.length ?? 0} total) ===`)
    todasAsist?.forEach(a => {
      const nombre = a.inscripciones?.nombre_estudiante || '?'
      const apellido = a.inscripciones?.apellido_estudiante || '?'
      console.log(`  ${nombre} ${apellido} → ${a.estado} | created_at: ${a.created_at}`)
    })
  }
}

investigate().catch(console.error)
