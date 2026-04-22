import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkPerfiles() {
  const ids = [
    'a59de63d-0f1b-42dd-885e-16d0d623520d', // María Soledad Gómez
    '1dfbaa19-8386-43eb-b68c-723c35675baf'  // ?
  ]
  
  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('*')
    .in('id', ids)
  
  console.log(perfiles)
}

checkPerfiles().catch(console.error)
