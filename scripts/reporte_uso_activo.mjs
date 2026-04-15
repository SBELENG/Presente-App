import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function usage() {
  const { data: catedras } = await supabase
    .from('catedras')
    .select('id, nombre, docente_id, fecha_inicio, fecha_fin, dias_clase')
    .order('nombre')

  console.log(`\n${'='.repeat(70)}`)
  console.log(`  REPORTE DE USO ACTIVO — PRESENTE APP`)
  console.log(`${'='.repeat(70)}\n`)

  const resultados = []

  for (const cat of catedras) {
    // Clases registradas
    const { data: clases } = await supabase
      .from('clases')
      .select('id, fecha, estado_clase')
      .eq('catedra_id', cat.id)
      .order('fecha')

    // Inscriptos
    const { count: inscriptos } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('catedra_id', cat.id)

    const { count: inscriptosActivos } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('catedra_id', cat.id)
      .eq('estado', 'activo')

    // Asistencias totales
    const claseIds = (clases || []).map(c => c.id)
    let totalAsistencias = 0
    let ultimaAsistencia = null

    if (claseIds.length > 0) {
      const { count } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .in('clase_id', claseIds)
        .eq('estado', 'presente')

      totalAsistencias = count || 0

      const { data: ultima } = await supabase
        .from('asistencias')
        .select('created_at')
        .in('clase_id', claseIds)
        .order('created_at', { ascending: false })
        .limit(1)

      ultimaAsistencia = ultima?.[0]?.created_at ?? null
    }

    // Última clase registrada
    const ultimaClase = clases?.length > 0 ? clases[clases.length - 1].fecha : null

    // Definir "activa": tiene clases registradas Y asistencias > 0
    const activa = clases?.length > 0 && totalAsistencias > 0

    resultados.push({
      nombre: cat.nombre,
      activa,
      clases: clases?.length ?? 0,
      inscriptos: inscriptos ?? 0,
      inscriptosActivos: inscriptosActivos ?? 0,
      asistencias: totalAsistencias,
      ultimaClase,
      ultimaAsistencia,
      diasClase: cat.dias_clase?.join(', ') || '⚠️ sin configurar',
    })
  }

  // Ordenar: activas primero
  resultados.sort((a, b) => b.activa - a.activa || b.asistencias - a.asistencias)

  const activas = resultados.filter(r => r.activa)
  const inactivas = resultados.filter(r => !r.activa)

  console.log(`📊 TOTAL CÁTEDRAS: ${resultados.length}`)
  console.log(`   ✅ Activas (con clases + asistencias): ${activas.length}`)
  console.log(`   ⚠️  Sin actividad registrada:          ${inactivas.length}\n`)

  console.log(`${'─'.repeat(70)}`)
  console.log(`  CÁTEDRAS ACTIVAS`)
  console.log(`${'─'.repeat(70)}`)

  for (const r of activas) {
    const ultimaFecha = r.ultimaAsistencia
      ? new Date(r.ultimaAsistencia).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—'
    console.log(`\n  📚 ${r.nombre}`)
    console.log(`     Clases registradas: ${r.clases} | Alumnos: ${r.inscriptos} (${r.inscriptosActivos} activos)`)
    console.log(`     Asistencias (presente): ${r.asistencias}`)
    console.log(`     Días de cursada: ${r.diasClase}`)
    console.log(`     Última actividad: ${ultimaFecha}`)
  }

  if (inactivas.length > 0) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`  SIN ACTIVIDAD (creadas pero sin uso)`)
    console.log(`${'─'.repeat(70)}`)
    for (const r of inactivas) {
      console.log(`\n  📋 ${r.nombre}`)
      console.log(`     Clases: ${r.clases} | Alumnos: ${r.inscriptos} | Asistencias: ${r.asistencias}`)
    }
  }

  console.log(`\n${'='.repeat(70)}\n`)
}

usage().catch(console.error)
