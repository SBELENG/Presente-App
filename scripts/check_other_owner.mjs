import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkOwner() {
  const targetId = '1dfbaa19-8386-43eb-b68c-723c35675baf'
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .single()
  
  if (profile) {
    console.log(`Email: ${profile.email} | Name: ${profile.nombre} ${profile.apellido}`)
  } else {
    const { data: cat } = await supabase.from('catedras').select('*').eq('docente_id', targetId).limit(1)
    console.log('No profile, but owns:', cat?.[0]?.nombre)
  }
}

checkOwner().catch(console.error)
