import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function deleteSunday() {
  const dateStr = '2026-04-26'
  console.log(`Buscando clases el domingo ${dateStr}...`)

  const { data: clases, error: clsError } = await supabase
    .from('clases')
    .select('id, catedra_id')
    .eq('fecha', dateStr)

  if (clsError) {
    console.error('Error buscando clases:', clsError)
    return
  }

  if (!clases || clases.length === 0) {
    console.log('No se encontraron clases para esa fecha.')
    return
  }

  console.log(`Se encontraron ${clases.length} clases. Eliminando asistencias asociadas...`)

  const classIds = clases.map(c => c.id)

  const { error: asisError } = await supabase
    .from('asistencias')
    .delete()
    .in('clase_id', classIds)

  if (asisError) {
    console.error('Error eliminando asistencias:', asisError)
    return
  }

  console.log('Asistencias eliminadas. Eliminando clases...')

  const { error: delClsError } = await supabase
    .from('clases')
    .delete()
    .in('id', classIds)

  if (delClsError) {
    console.error('Error eliminando clases:', delClsError)
    return
  }

  console.log('Operación completada con éxito.')
}

deleteSunday()
