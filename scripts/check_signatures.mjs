import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkSignatures(claseId) {
  const { data: assists } = await supabase
    .from('asistencias')
    .select('*, inscripciones(nombre_estudiante, apellido_estudiante)')
    .eq('clase_id', claseId)
  
  console.log(`--- FIRMAS ENCONTRADAS PARA EL DOMINGO ${claseId} ---`)
  assists?.forEach(a => {
    console.log(`${a.inscripciones?.apellido_estudiante}, ${a.inscripciones?.nombre_estudiante} | Estado: ${a.estado}`)
  })
}

checkSignatures('d5bb1647-29b6-42f4-8a6a-fcf499b0a843')
