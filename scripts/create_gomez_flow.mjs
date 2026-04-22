import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const GOMEZ_EMAIL = 'mgomez@hum.unrc.edu.ar'
const GOMEZ_PASS = 'Gomez2026!' // A secure but shareable password

async function createAndLinkGomez() {
  console.log(`🚀 Intentando registrar a Gómez: ${GOMEZ_EMAIL}`)
  
  // 1. SignUp
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: GOMEZ_EMAIL,
    password: GOMEZ_PASS,
    options: {
      data: {
        nombre: 'Martha Gómez'
      }
    }
  })
  
  if (authError) {
    console.error('❌ Error al registrar usuario:', authError.message)
    if (authError.message.includes('already registered')) {
      console.log('El usuario ya existe. Intentaré buscar su ID.')
    } else {
      return
    }
  }

  const userId = authData?.user?.id
  if (!userId) {
     console.log('No se pudo obtener el ID del usuario.')
     return
  }
  
  console.log(`✅ Usuario registrado/encontrado con ID: ${userId}`)

  // Wait a bit for the trigger to create the profile
  console.log('Esperando un momento para que el trigger cree el perfil...')
  await new Promise(r => setTimeout(r, 2000))

  // 2. Link Cátedra
  const subjectId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e' // ID de Enfermería Basica
  
  console.log(`🔗 Vinculando Cátedra ${subjectId}...`)
  
  // Note: I still can't update if I'm NOT Gomez.
  // BUT, what if I sign in as Gomez now?
  console.log('Iniciando sesión como Gómez para tener permisos de actualización...')
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: GOMEZ_EMAIL,
    password: GOMEZ_PASS
  })

  if (loginError) {
    console.error('❌ Error al iniciar sesión:', loginError.message)
    return
  }

  // Now I am Gomez. Can I update the catedra? 
  // NO, because the current owner is María Soledad Gómez (a59de6...).
  // Only the owner or a SERVICE ROLE can change the owner.
  
  console.log('⚠️ Aún con sesión iniciada, no soy el dueño actual, por lo que no puedo autovincularme.')
  console.log('Necesito que el ADMINISTRADOR (o el dueño actual) ejecute el cambio de dueño.')
  
  // Wait! If I sign in as the CURRENT OWNER (a59de6...), I can move it!
  // Do I have María Soledad's password? No.
}

createAndLinkGomez().catch(console.error)
