import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function debug() {
  const docenteId = 'a56bc6ec-f239-423d-b4be-886ec4ec1780'
  
  console.log('=== Cátedra de Educación en Enfermería ===')
  const { data: catedras, error } = await supabase
    .from('catedras')
    .select('*')
    .eq('docente_id', docenteId)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  for (const c of catedras) {
    console.log(`\nFULL DATA:`)
    console.log(JSON.stringify(c, null, 2))
    
    // Check for null fields that could crash the UI
    console.log(`\n=== NULL CHECK ===`)
    console.log(`nombre: ${c.nombre === null ? 'NULL!' : 'OK'}`)
    console.log(`codigo: ${c.codigo === null ? 'NULL!' : 'OK'} (${c.codigo})`)
    console.log(`carrera: ${c.carrera === null ? 'NULL!' : 'OK'} (${c.carrera})`)
    console.log(`facultad: ${c.facultad === null ? 'NULL!' : 'OK'} (${c.facultad})`)
    console.log(`comision: ${c.comision === null ? 'NULL!' : 'OK'} (${c.comision})`)
    console.log(`dias_clase: ${c.dias_clase === null ? 'NULL!' : 'OK'} (${JSON.stringify(c.dias_clase)})`)
    console.log(`cant_parciales: ${c.cant_parciales === null ? 'NULL!' : 'OK'} (${c.cant_parciales})`)
    console.log(`cant_recuperatorios: ${c.cant_recuperatorios === null ? 'NULL!' : 'OK'} (${c.cant_recuperatorios})`)
    console.log(`porcentaje_asistencia: ${c.porcentaje_asistencia === null ? 'NULL!' : 'OK'} (${c.porcentaje_asistencia})`)
    console.log(`es_promocional: ${c.es_promocional === null ? 'NULL!' : 'OK'} (${c.es_promocional})`)
    console.log(`tipo_clase: ${c.tipo_clase === null ? 'NULL!' : 'OK'} (${c.tipo_clase})`)
    console.log(`fecha_inicio: ${c.fecha_inicio === null ? 'NULL!' : 'OK'} (${c.fecha_inicio})`)
    console.log(`fecha_fin: ${c.fecha_fin === null ? 'NULL!' : 'OK'} (${c.fecha_fin})`)
    console.log(`bloques_semanales: ${JSON.stringify(c.bloques_semanales)}`)
    console.log(`comisiones_division: ${JSON.stringify(c.comisiones_division)}`)
  }
  
  // Check inscripciones for this docente
  if (catedras.length > 0) {
    const catedraIds = catedras.map(c => c.id)
    
    const { count: inscCount } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .in('catedra_id', catedraIds)
    console.log(`\nInscripciones: ${inscCount}`)
    
    const { count: clasesCount } = await supabase
      .from('clases')
      .select('*', { count: 'exact', head: true })
      .in('catedra_id', catedraIds)
    console.log(`Clases: ${clasesCount}`)
    
    // Get sample clases to inspect
    const { data: clases } = await supabase
      .from('clases')
      .select('*')
      .in('catedra_id', catedraIds)
      .limit(5)
    
    console.log(`\nSample clases:`)
    for (const cl of clases || []) {
      console.log(JSON.stringify(cl))
    }
  }
}

debug().catch(console.error)
