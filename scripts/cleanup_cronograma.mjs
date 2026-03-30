import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const DIAS_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }

async function cleanupHolidays() {
  console.log('--- INICIANDO LIMPIEZA TOTAL DE APP PRESENTE ---')
  
  const { data: catedras, error: catErr } = await supabase.from('catedras').select('*')
  if (catErr) { console.error(catErr); return }
  
  // Analizamos TODAS las clases
  const { data: clases, error: clsErr } = await supabase
    .from('clases')
    .select('*, asistencias(id)')

  if (clsErr) { console.error(clsErr); return }

  console.log(`Analizando ${clases.length} clases en toda la App...`)
  
  let deletedCount = 0

  for (const clase of clases) {
    const cat = catedras.find(c => c.id === clase.catedra_id)
    if (!cat) continue

    // REGLA DE ORO: Si hay firmas de alumnos, NO SE TOCA NADA.
    if (clase.asistencias && clase.asistencias.length > 0) continue

    const fechaObj = new Date(clase.fecha + 'T12:00:00')
    const diaNum = fechaObj.getDay()

    // 1. CASO CRÍTICO: DOMINGOS. 
    // Borramos cualquier domingo sin asistencias.
    if (diaNum === 0) {
       console.log(`[ELIMINANDO DOMINGO] ${clase.fecha} (${clase.tema}) en ${cat.nombre}`)
       const { error: delErr } = await supabase.from('clases').delete().eq('id', clase.id)
       if (!delErr) deletedCount++
       continue
    }

    // 2. CASO EXCEPCIONES EN DÍAS OFF.
    if (clase.estado_clase !== 'normal') {
       const diasTeoria = (cat.dias_clase || []).map(d => DIAS_MAP[d])
       let diasPrac = (cat.dias_practica && cat.dias_practica.length > 0)
         ? cat.dias_practica.map(d => DIAS_MAP[d])
         : (cat.agenda_rota_practicas ? [1,2,3,4,5,6] : diasTeoria)

       const valid = [...new Set([...diasTeoria, ...diasPrac])]

       if (!valid.includes(diaNum)) {
          console.log(`[ELIMINANDO EXCEPCIÓN] ${clase.tema} (${clase.fecha}) en ${cat.nombre} (Día ${diaNum})`)
          const { error: delErr } = await supabase.from('clases').delete().eq('id', clase.id)
          if (!delErr) deletedCount++
       }
    }
  }

  console.log(`--- LIMPIEZA FINALIZADA: ${deletedCount} registros eliminados ---`)
}

cleanupHolidays()
