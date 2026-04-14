import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function remedy() {
  const emails = ['glynch@hum.unrc.edu.ar', 'lynchgabriela@gmail.com']
  const REDIRECT_URL = 'https://presente-app-nine.vercel.app/reset-password'

  for (const email of emails) {
    console.log(`📧 Intentando enviar recuperación a: ${email}`)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: REDIRECT_URL
    })
    
    if (error) {
      console.log(`❌ Error para ${email}: ${error.message}`)
    } else {
      console.log(`✅ Supabase dice que envió el correo a ${email}`)
    }
  }
}

remedy()
