import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EMAIL = 'lynchgabriela@gmail.com'
const REDIRECT_URL = 'https://presente-app-nine.vercel.app/reset-password'

async function sendRecovery() {
  console.log(`📧 Enviando link de recuperación a ${EMAIL}...`)
  
  const { error } = await supabase.auth.resetPasswordForEmail(EMAIL, {
    redirectTo: REDIRECT_URL
  })

  if (error) {
    console.error('❌ Error:', error.message)
  } else {
    console.log('✅ Link enviado correctamente!')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Redirige a: ${REDIRECT_URL}`)
    console.log('')
    console.log('📱 Gabriela recibirá un email con un link.')
    console.log('   Al hacer click, irá directo al formulario de nueva contraseña.')
  }
}

sendRecovery()
