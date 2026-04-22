import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function findOwner() {
  const targetId = 'a59de63d-0f1b-42dd-885e-16d0d623520d'
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .single()
  
  if (profile) {
    console.log(`El dueño real de la cátedra es: ${profile.email}`)
    console.log(`Nombre: ${profile.nombre} ${profile.apellido}`)
  } else {
    console.log('No hay perfil de usuario para ese ID. El acceso está huérfano.')
  }
}

findOwner().catch(console.error)
