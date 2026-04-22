import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkPerfilesPresti() {
  const ids = [
    'a56bc6ec-f239-423d-b4be-886ec4ec1780',
    'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a'
  ]

  console.log('=== Checking perfiles for IDs ===')
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .in('id', ids)
  
  if (error) {
    console.error('Error:', error)
  } else {
    data.forEach(p => console.log(`ID: ${p.id} | Name: ${p.nombre} ${p.apellido} | Rol: ${p.rol}`))
  }
}

checkPerfilesPresti().catch(console.error)
