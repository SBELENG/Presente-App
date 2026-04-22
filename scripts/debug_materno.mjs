import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function debugMaterno() {
  const catedraId = 'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'
  
  console.log('=== Cátedra de Enfermería Materno Infantil ===')
  const { data: c, error } = await supabase
    .from('catedras')
    .select('*')
    .eq('id', catedraId)
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(JSON.stringify(c, null, 2))
}

debugMaterno().catch(console.error)
