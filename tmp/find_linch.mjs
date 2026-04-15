import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function findLinch() {
  console.log("Searching for 'Linch' in users/docentes...")
  
  // Try public.docentes if it exists
  const { data: docentes, error: docError } = await supabase
    .from('docentes')
    .select('*')
    .ilike('nombre', '%Linch%')
  
  if (docError) {
    console.log("Error querying docentes (maybe table doesn't exist or no permission):", docError.message)
  } else {
    console.log("Found in docentes:", docentes)
  }

  // Also check catedras to see who is assigned to "Enfermería Basica"
  const { data: catedras } = await supabase
    .from('catedras')
    .select('*, docente:docente_id(*)')
    .ilike('nombre', '%Enfermería Basica%')
  
  console.log("Cátedras found:", catedras)
}

findLinch()
