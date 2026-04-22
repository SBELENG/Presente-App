import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkInsc() {
  const id = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e' // Enfermería Basica

  const { count } = await supabase
    .from('inscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('catedra_id', id)
  
  console.log(`Cátedra Enfermería Básica (${id}): ${count} inscriptos`)

  // Check if bloquess_semanales is OK
  const { data: cat } = await supabase.from('catedras').select('bloques_semanales').eq('id', id).single()
  console.log('Bloques semanales:', JSON.stringify(cat?.bloques_semanales))
}

checkInsc().catch(console.error)
