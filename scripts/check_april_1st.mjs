import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const dates = ['2026-03-31', '2026-04-01']
  
  for (const targetDate of dates) {
    console.log(`\n=== REVISANDO ASISTENCIAS PARA EL ${targetDate} ===`)

    // 1. Buscar todas las clases en esa fecha
    const { data: clases, error: errorClases } = await supabase
      .from('clases')
      .select('*, catedras(nombre)')
      .eq('fecha', targetDate)

    if (errorClases) {
      console.error('Error buscando clases:', errorClases)
      continue
    }

    if (!clases || clases.length === 0) {
      console.log('No se encontraron registros de clases para esa fecha.')
      continue
    }

    for (const clase of clases) {
      // 2. Buscar asistencias para esta clase
      const { data: asistencias, error: errorAsist } = await supabase
        .from('asistencias')
        .select('*')
        .eq('clase_id', clase.id)

      if (errorAsist) {
        console.error(`Error buscando asistencias para clase ${clase.id}:`, errorAsist)
        continue
      }

      const statusSummary = {}
      asistencias.forEach(a => {
        statusSummary[a.estado] = (statusSummary[a.estado] || 0) + 1
      })

      const { count: totalInscripciones } = await supabase
        .from('inscripciones')
        .select('id', { count: 'exact', head: true })
        .eq('catedra_id', clase.catedra_id)

      console.log(`\nCátedra: ${clase.catedras?.nombre || 'Desconocida'} (${clase.catedra_id})`)
      console.log(`  ID Clase: ${clase.id}`)
      console.log(`  Tipo: ${clase.tipo}`)
      console.log(`  Total Alumnos Inscritos: ${totalInscripciones}`)
      console.log(`  Resumen Estados: ${JSON.stringify(statusSummary)}`)
      console.log(`  Total registros asistencia: ${asistencias.length}`)

      const presentes = statusSummary['presente'] || 0
      if (clase.catedra_id === 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e') {
        console.log(`  >>> ESTA ES ENFERMERÍA BÁSICA <<<`)
        if (asistencias.length < totalInscripciones) {
           console.log(`  ADVERTENCIA: Faltan ${totalInscripciones - asistencias.length} registros de asistencia.`)
        }
      }

      if (presentes === 4 && targetDate === '2026-04-01') {
        console.log(`  >>> ESTA PODRÍA SER LA CÁTEDRA DEL PROBLEMA (TIENE EXACTAMENTE 4 PRESENTES) <<<`)
        
        // Ver quiénes son los presentes
        const { data: inscripciones } = await supabase
          .from('inscripciones')
          .select('id, nombre_estudiante, apellido_estudiante')
          .in('id', asistencias.filter(a => a.estado === 'presente').map(a => a.inscripcion_id))
        
        console.log('  Presentes:')
        inscripciones.forEach(i => console.log(`    - ${i.apellido_estudiante}, ${i.nombre_estudiante}`))
      }
    }
  }
}

check().catch(console.error)
