import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const DIAS_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }

function generarFechas(fechaInicio, fechaFin, diasSemana = []) {
  if (!fechaInicio || !fechaFin || diasSemana.length === 0) return []
  const inicio = new Date(fechaInicio + 'T12:00:00')
  const fin = new Date(fechaFin + 'T12:00:00')
  const diasNums = diasSemana.map(d => DIAS_MAP[d]).filter(n => n !== undefined)
  const resultado = []
  const cur = new Date(inicio)
  while (cur <= fin) {
    if (diasNums.includes(cur.getDay())) resultado.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return resultado
}

async function debug() {
  // Buscar la cátedra "Prueba 2" o la primera cátedra con clases
  const { data: catedras } = await supabase.from('catedras').select('*')
  
  console.log('\n=== CÁTEDRAS DISPONIBLES ===')
  catedras.forEach(c => {
    console.log(`  [${c.id.slice(0,8)}] ${c.nombre} | inicio: ${c.fecha_inicio} | fin: ${c.fecha_fin} | dias: ${JSON.stringify(c.dias_clase)}`)
  })

  // Para cada cátedra, simular el cálculo
  for (const cat of catedras) {
    const { data: clases } = await supabase.from('clases').select('*').eq('catedra_id', cat.id)
    const { data: inscripciones } = await supabase.from('inscripciones').select('*').eq('catedra_id', cat.id)
    
    if (!inscripciones || inscripciones.length === 0) continue

    const clasesIds = (clases || []).map(c => c.id)
    let asistencias = []
    if (clasesIds.length > 0) {
      const { data: asist } = await supabase.from('asistencias').select('*').in('clase_id', clasesIds)
      asistencias = asist || []
    }

    const fechasTeoria = generarFechas(cat.fecha_inicio, cat.fecha_fin, cat.dias_clase || [])

    // Simular isExc y getClase como en el frontend
    const getClase = (fecha) => {
      const fs = fecha.toISOString().split('T')[0]
      return (clases || []).find(c => c.fecha === fs)
    }
    const isExc = (fecha) => {
      const clase = getClase(fecha)
      return clase ? clase.estado_clase !== 'normal' : false
    }

    const validasProyectadas = fechasTeoria.filter(f => !isExc(f))
    const excepciones = fechasTeoria.filter(f => isExc(f))
    const tomadas = fechasTeoria.filter(f => getClase(f))
    const validasTomadas = tomadas.filter(f => !isExc(f))

    console.log(`\n=== CÁTEDRA: ${cat.nombre} ===`)
    console.log(`  fecha_inicio: ${cat.fecha_inicio}`)
    console.log(`  fecha_fin:    ${cat.fecha_fin}`)
    console.log(`  dias_clase:   ${JSON.stringify(cat.dias_clase)}`)
    console.log(`  tipo_clase:   ${JSON.stringify(cat.tipo_clase)}`)
    console.log(`  --`)
    console.log(`  Total fechas generadas (teoria):  ${fechasTeoria.length}`)
    console.log(`  Excepciones marcadas:              ${excepciones.length}`)
    console.log(`  Válidas proyectadas (denominador): ${validasProyectadas.length}`)
    console.log(`  Clases tomadas (con registro DB):  ${tomadas.length}`)
    console.log(`  Válidas tomadas (no excepción):    ${validasTomadas.length}`)

    if (inscripciones.length > 0) {
      console.log(`\n  --- % ASISTENCIA POR ALUMNO ---`)
      for (const insc of inscripciones.slice(0, 5)) {
        const presentesCount = fechasTeoria.filter(f => {
          if (isExc(f) || !getClase(f)) return false
          const clase = getClase(f)
          return asistencias.find(a => a.inscripcion_id === insc.id && a.clase_id === clase.id)?.estado === 'presente'
        }).length

        const pct = validasProyectadas.length > 0 
          ? Math.round((presentesCount / validasProyectadas.length) * 100)
          : null

        console.log(`  Alumno: ${insc.apellido_estudiante}, ${insc.nombre_estudiante}`)
        console.log(`    Presentes: ${presentesCount} / Denominador: ${validasProyectadas.length} → ${pct}%`)
      }
    }
  }
}

debug().catch(console.error)
