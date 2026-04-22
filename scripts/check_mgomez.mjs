import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkGomez() {
  const email = 'mgomez@hum.unrc.edu.ar'
  console.log(`=== Buscando perfil para: ${email} ===`)
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
  
  if (profile) {
    console.log(`PERFIL ENCONTRADO!`)
    console.log(`ID: ${profile.id}`)
    console.log(`Nombre: ${profile.nombre} ${profile.apellido}`)
    
    // Ver cátedras vinculadas
    const { data: catedras } = await supabase
      .from('catedras')
      .select('id, nombre, docente_id')
      .eq('docente_id', profile.id)
    
    console.log(`\nCátedras vinculadas a este usuario:`)
    if (catedras && catedras.length > 0) {
      catedras.forEach(c => console.log(`- ${c.nombre} (ID: ${c.id})`))
    } else {
      console.log('No tiene ninguna cátedra vinculada todavía.')
    }
  } else {
    console.log(`No se encontró ningún perfil con el mail ${email}`)
  }
}

checkGomez().catch(console.error)
