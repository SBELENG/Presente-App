import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function getTables() {
  // Query for all tables in the public schema
  const { data, error } = await supabase.rpc('get_tables_info')
  if (error) {
    console.log("RPC get_tables_info failed:", error.message)
    // Fallback: try to guess common names
    const common = ['catedras', 'clases', 'asistencias', 'inscripciones', 'docentes', 'usuarios', 'perfiles', 'profiles', 'docente_catedra']
    for (const table of common) {
       const { error: err } = await supabase.from(table).select('count', { count: 'exact', head: true })
       if (!err) {
         console.log(`Table exists: ${table}`)
       }
    }
  } else {
    console.log("Tables:", data)
  }
}

getTables()
