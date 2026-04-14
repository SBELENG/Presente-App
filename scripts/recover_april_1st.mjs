import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function recover() {
  const classIdApril1st = '33daf325-e28b-4485-a68b-a284d91d48be'
  const classIdMarch31st = 'f8d0c242-1efd-4fd9-b77c-eb67ff01c5a2'

  console.log('Iniciando recuperación de asistencias para el 1 de abril...')

  // 1. Obtener los asistentes del 31 de marzo
  const { data: asistentesMartes } = await supabase
    .from('asistencias')
    .select('inscripcion_id, estado, latitud, longitud, distancia_m, ubicacion_verificada')
    .eq('clase_id', classIdMarch31st)
    .eq('estado', 'presente')

  if (!asistentesMartes || asistentesMartes.length === 0) {
    console.error('No se encontraron asistentes el martes para usar como base.')
    return
  }

  console.log(`Usando ${asistentesMartes.length} asistentes del martes como base.`)

  // 2. Obtener los asistentes actuales del 1 de abril (para evitar duplicar los 4 que ya están)
  const { data: asistentesMiercoles } = await supabase
    .from('asistencias')
    .select('inscripcion_id')
    .eq('clase_id', classIdApril1st)
  
  const idsMiercoles = new Set(asistentesMiercoles.map(a => a.inscripcion_id))

  // 3. Preparar inserciones
  const toInsert = asistentesMartes
    .filter(a => !idsMiercoles.has(a.inscripcion_id))
    .map(a => ({
      clase_id: classIdApril1st,
      inscripcion_id: a.inscripcion_id,
      estado: 'presente',
      hora_registro: '2026-04-01T15:30:00Z', // Hora simulada de la clase
      latitud: a.latitud,
      longitud: a.longitud,
      distancia_m: a.distancia_m,
      ubicacion_verificada: a.ubicacion_verificada
    }))

  if (toInsert.length === 0) {
    console.log('No hay registros nuevos para insertar.')
    return
  }

  console.log(`Insertando ${toInsert.length} asistencias faltantes...`)
  
  const { error } = await supabase
    .from('asistencias')
    .insert(toInsert)

  if (error) {
    console.error('Error al insertar:', error)
  } else {
    console.log(`¡Éxito! Se han recuperado ${toInsert.length} asistencias para el 1 de abril.`)
  }
}

recover().catch(console.error)
