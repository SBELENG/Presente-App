import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function debug() {
  const docenteId = 'a59de63d-0f1b-42dd-885e-16d0d623520d' // Según reporte previo
  
  console.log('=== Cátedra: Enfermería Básica ===')
  const { data: catedras, error } = await supabase
    .from('catedras')
    .select('*')
    .eq('docente_id', docenteId)
    .ilike('nombre', '%enfermería basica%')
  
  if (error || !catedras || catedras.length === 0) {
    console.log('No se encontró por docente_id exacto, buscando por nombre...')
    const { data: catPorNombre } = await supabase
      .from('catedras')
      .select('*')
      .ilike('nombre', '%enfermería basica%')
    
    if (!catPorNombre || catPorNombre.length === 0) {
      console.log('Cátedra no encontrada por nombre tampoco.')
      return
    }
    console.log('Encontrada por nombre:', catPorNombre.map(c => c.nombre))
    return debugCatedra(catPorNombre[0])
  }
  
  return debugCatedra(catedras[0])
}

async function debugCatedra(c) {
  console.log(`\nCátedra: ${c.nombre} (ID: ${c.id})`)
  console.log(`Código: ${c.codigo}`)
  console.log(`Días de clase: ${JSON.stringify(c.dias_clase)}`)
  
  const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires'
  }).format(new Date())
  
  console.log(`HOY ES: ${today}`)
  
  // Buscar clases de hoy
  const { data: clasesHoy } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', c.id)
    .eq('fecha', today)
  
  console.log(`\nClases abiertas para hoy: ${clasesHoy?.length || 0}`)
  if (clasesHoy && clasesHoy.length > 0) {
    for (const cl of clasesHoy) {
      const { count: asistCount } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('clase_id', cl.id)
      
      console.log(`  - Clase ID: ${cl.id} (${cl.tipo}) -> Asistencias marcadas: ${asistCount}`)
    }
  } else {
    // Buscar la última clase que se abrió
    const { data: ultimaClase } = await supabase
      .from('clases')
      .select('*')
      .eq('catedra_id', c.id)
      .order('fecha', { ascending: false })
      .limit(1)
    
    if (ultimaClase && ultimaClase.length > 0) {
      console.log(`\nÚltima clase registrada: ${ultimaClase[0].fecha} (ID: ${ultimaClase[0].id})`)
    } else {
      console.log('\nNo hay ninguna clase registrada para esta cátedra.')
    }
  }
}

debug().catch(console.error)
