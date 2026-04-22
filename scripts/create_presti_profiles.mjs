import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

const PROFILES = [
  {
    id: 'a56bc6ec-f239-423d-b4be-886ec4ec1780', // educacacionenenfermeria@hum.unrc.edu.ar
    nombre: 'Trinidad',
    apellido: 'Prestti',
    rol: 'docente'
  },
  {
    id: 'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a', // 5214maternoinf@hum.unrc.edu.ar
    nombre: 'Trinidad',
    apellido: 'Prestti',
    rol: 'docente'
  }
]

async function createProfiles() {
  console.log('--- Creating missing profiles for Prof. Prestti ---')
  
  const { data, error } = await supabase
    .from('perfiles')
    .upsert(PROFILES, { onConflict: 'id' })
  
  if (error) {
    console.error('Error creating profiles:', error)
  } else {
    console.log('Successfully created/updated profiles for both accounts.')
  }
}

createProfiles().catch(console.error)
