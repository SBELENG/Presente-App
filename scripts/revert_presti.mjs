import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function revertPresti() {
  console.log('🔙 Reversionando unificación para Prof. Presti...')
  
  // Enfermería Materno Infantil (5214) vuelve a su ID original
  const maternoId = 'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'
  const originalMaternoDocenteId = 'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a'
  
  const { error } = await supabase
    .from('catedras')
    .update({ docente_id: originalMaternoDocenteId })
    .eq('id', maternoId)
  
  if (error) {
    console.error('Error al revertir Materno Infantil:', error.message)
  } else {
    console.log('✅ Materno Infantil (5214) revertida al ID original.')
  }
}

revertPresti().catch(console.error)
