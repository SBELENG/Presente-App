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

async function compare() {
  const { data: catedras } = await supabase.from('catedras').select('*')

  for (const cat of catedras) {
    const { data: inscripciones } = await supabase.from('inscripciones').select('*').eq('catedra_id', cat.id)
    if (!inscripciones?.length) continue

    const { data: clases } = await supabase.from('clases').select('*').eq('catedra_id', cat.id)
    const clasesIds = (clases || []).map(c => c.id)

    let asistencias = []
    if (clasesIds.length > 0) {
      const { data: asist } = await supabase.from('asistencias').select('*').in('clase_id', clasesIds)
      asistencias = asist || []
    }

    // === LÓGICA DEL DOCENTE ===
    const tipo = Array.isArray(cat.tipo_clase) ? cat.tipo_clase : [cat.tipo_clase || 'teorico_practica']
    const esTeo = tipo.includes('teorica') || tipo.includes('teorico_practica')
    const diasTeoria = cat.dias_clase || []
    const fechasTeoria = esTeo ? generarFechas(cat.fecha_inicio, cat.fecha_fin, diasTeoria) : []

    const getClaseDoc = (fecha) => {
      const fs = fecha.toISOString().split('T')[0]
      return (clases || []).find(c => c.fecha === fs)
    }
    const isExcDoc = (fecha) => {
      const clase = getClaseDoc(fecha)
      return clase ? clase.estado_clase !== 'normal' : false
    }
    const validasDocente = fechasTeoria.filter(f => !isExcDoc(f))

    // === LÓGICA DEL ALUMNO (ANTES del fix - sin `fecha`) ===
    // simula classes sin `fecha` (como estaba el bug)
    const clasesSinFecha = (clases || []).map(c => ({ id: c.id, estado_clase: c.estado_clase }))

    // === LÓGICA DEL ALUMNO (DESPUÉS del fix - con `fecha`) ===
    const clasesConFecha = clases || []

    const validasAlumnoSinFecha = fechasTeoria.filter(dDate => {
      const fs = dDate.toISOString().split('T')[0]
      const dbClase = clasesSinFecha?.find(c => c.fecha === fs) // c.fecha siempre undefined → nunca encuentra
      return !dbClase || dbClase.estado_clase === 'normal'
    })

    const validasAlumnoConFecha = fechasTeoria.filter(dDate => {
      const fs = dDate.toISOString().split('T')[0]
      const dbClase = clasesConFecha?.find(c => c.fecha === fs)
      return !dbClase || dbClase.estado_clase === 'normal'
    })

    console.log(`\n=== ${cat.nombre} ===`)
    console.log(`  Docente válidas:         ${validasDocente.length} (de ${fechasTeoria.length} totales)`)
    console.log(`  Alumno (bug sin fecha):  ${validasAlumnoSinFecha.length} (de ${fechasTeoria.length} totales)`)
    console.log(`  Alumno (fix con fecha):  ${validasAlumnoConFecha.length} (de ${fechasTeoria.length} totales)`)

    const mismatches = validasDocente.length !== validasAlumnoConFecha.length
    if (mismatches) {
      console.log(`  ⚠️  MISMATCH: docente=${validasDocente.length} vs alumno=${validasAlumnoConFecha.length}`)
    } else {
      console.log(`  ✅ Match perfecto tras el fix`)
    }

    // Muestra 2 alumnos como ejemplo
    for (const insc of inscripciones.slice(0, 2)) {
      const presentesCount = asistencias.filter(a => {
        if (a.inscripcion_id !== insc.id || a.estado !== 'presente') return false
        const clase = (clases || []).find(c => c.id === a.clase_id)
        if (!clase) return false
        const fecha = new Date(clase.fecha + 'T12:00:00')
        return !isExcDoc(fecha)
      }).length

      const pctDoc = validasDocente.length > 0 ? Math.round(presentesCount / validasDocente.length * 100) : 0
      const pctAlumnoBug = validasAlumnoSinFecha.length > 0 ? Math.round(presentesCount / validasAlumnoSinFecha.length * 100) : 0
      const pctAlumnoFix = validasAlumnoConFecha.length > 0 ? Math.round(presentesCount / validasAlumnoConFecha.length * 100) : 0

      console.log(`  Alumno: ${insc.apellido_estudiante} → ${presentesCount}P`)
      console.log(`    Docente: ${pctDoc}% | Bug: ${pctAlumnoBug}% | Fix: ${pctAlumnoFix}%`)
    }
  }
}

compare().catch(console.error)
