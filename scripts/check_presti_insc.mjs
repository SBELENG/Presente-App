import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkInsc() {
  const ids = [
    '7dee9248-ddfb-4591-b19c-c2cb24f9250d', // Educación
    'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'  // Materno
  ]

  for (const id of ids) {
    const { count } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('catedra_id', id)
    
    console.log(`Cátedra ${id}: ${count} inscriptos`)
  }
}

checkInsc().catch(console.error)
