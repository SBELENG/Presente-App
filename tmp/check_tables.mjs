import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function getTables() {
  const { data, error } = await supabase.from('usuarios').select('*').limit(5)
  if (error) {
     console.log("usuarios table failed:", error.message)
  } else {
     console.log("usuarios table sample:", data)
  }

  const { data: perfiles, error: perfError } = await supabase.from('perfiles').select('*').limit(5)
  if (perfError) {
     console.log("perfiles table failed:", perfError.message)
  } else {
     console.log("perfiles table sample:", perfiles)
  }
}

getTables()
