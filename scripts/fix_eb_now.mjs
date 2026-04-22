import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function fixEB() {
  const id = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  const { data, error } = await supabase.from('catedras').update({ bloques_semanales: [] }).eq('id', id).select()
  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('✅ Enfermería Básica corregida (bloques_semanales: [])')
  }
}

fixEB().catch(console.error)
