import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkUser() {
  const emailArr = [
    'enfermeriabasica@hum.unrc.edu.ar',
    'enfermeria.basica@hum.unrc.edu.ar',
    'enfermeriabasica@unrc.edu.ar'
  ]
  
  console.log('=== Verificando Perfiles de Usuario ===')
  
  for (const email of emailArr) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (profile) {
      console.log(`\nENCONTRADO: ${email}`)
      console.log(`ID: ${profile.id}`)
      console.log(`Nombre: ${profile.nombre} ${profile.apellido}`)
      console.log(`Rol: ${profile.role}`)
    } else {
      console.log(`No se encontró perfil para: ${email}`)
    }
  }

  // Buscar por nombre de la catedra asociada
  console.log('\n=== Buscando por Cátedra Enfermería Básica ===')
  const { data: cat } = await supabase
    .from('catedras')
    .select('*, profiles:docente_id(*)')
    .ilike('nombre', '%enfermería basica%')
  
  if (cat && cat.length > 0) {
    cat.forEach(c => {
      console.log(`Cátedra: ${c.nombre}`)
      console.log(`Docente ID: ${c.docente_id}`)
      if (c.profiles) {
        console.log(`  Email del perfil: ${c.profiles.email}`)
        console.log(`  Nombre del perfil: ${c.profiles.nombre} ${c.profiles.apellido}`)
      } else {
        console.log(`  No tiene perfil vinculado en la tabla profiles.`)
        // Buscar el email directamente si el docente_id fuera un email (algunos casos legacy)
        if (c.docente_id && c.docente_id.includes('@')) {
           console.log(`  El docente_id parece ser un email: ${c.docente_id}`)
        }
      }
    })
  }
}

checkUser().catch(console.error)
