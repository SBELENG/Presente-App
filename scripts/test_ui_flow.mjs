import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runTest() {
  console.log("1. Fetching catedras for demo user...")
  const legacyId = '3cd85ad4-bd2a-4639-9c88-bb22bc63ed88'
  const { data: catedras, error: catErr } = await supabase.from('catedras').select('*').eq('docente_id', legacyId)
  
  if (catErr) {
    console.error("Failed to fetch catedras:", catErr)
    return
  }
  
  if (!catedras || catedras.length === 0) {
    console.log("No catedras found for user.")
    return
  }
  
  console.log(`Found ${catedras.length} catedras. Testing the first one: ${catedras[0].id} (${catedras[0].nombre})`)
  
  const id = catedras[0].id
  
  console.log("2. Simulating estadisticas/page.js fetchData()...")
  const [catRes, classesRes, studentsRes, gradesRes] = await Promise.all([
    supabase.from('catedras').select('*').eq('id', id).single(),
    supabase.from('clases').select('*').eq('catedra_id', id).order('fecha', { ascending: true }),
    supabase.from('inscripciones').select('*').eq('catedra_id', id),
    supabase.from('notas').select('*').eq('catedra_id', id)
  ])

  console.log("CatRes error:", catRes.error?.message)
  console.log("ClassesRes data:", classesRes.data?.length)
  console.log("StudentsRes data:", studentsRes.data?.length)
  console.log("GradesRes data:", gradesRes.data?.length)
  
  const clases = classesRes.data || []
  const classIds = clases.map(c => c.id)
  
  if (classIds.length > 0) {
    const { data: asistencias, error: asistenciasError } = await supabase.from('asistencias').select('*').in('clase_id', classIds)
    console.log("Asistencias data:", asistencias?.length)
    console.log("Asistencias error:", asistenciasError?.message)
  }
  
  console.log("All queries executed successfully.")
}

runTest()
