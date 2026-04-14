import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fixToday() {
  const fromClassId = '56c7780e-6f2c-46bc-bb67-fa0dce0b08be'
  const toClassId = '31535196-a642-4fbf-aa25-98d1cd1c86b5'

  console.log('Moviendo asistencias de hoy al ID de clase correcto (08/04)...')

  // 1. Buscar asistencias creadas hoy en la clase vieja
  const { data: toMove } = await supabase
    .from('asistencias')
    .select('id')
    .eq('clase_id', fromClassId)
    .gte('created_at', '2026-04-08T00:00:00Z')

  if (!toMove || toMove.length === 0) {
    console.log('No hay asistencias para mover hoy.')
    return
  }

  console.log(`Encontradas ${toMove.length} asistencias. Moviendo...`)

  const { error } = await supabase
    .from('asistencias')
    .update({ clase_id: toClassId })
    .in('id', toMove.map(a => a.id))

  if (error) {
    console.error('Error al mover:', error)
  } else {
    console.log(`¡Éxito! Se han movido ${toMove.length} asistencias al día de hoy.`)
  }
}

fixToday().catch(console.error)
