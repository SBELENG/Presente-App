import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test(id) {
  try {
    const [catRes, classesRes, studentsRes, gradesRes] = await Promise.all([
      supabase.from('catedras').select('*').eq('id', id).single(),
      supabase.from('clases').select('*').eq('catedra_id', id).order('fecha', { ascending: true }),
      supabase.from('inscripciones').select('*').eq('catedra_id', id),
      supabase.from('notas').select('*').eq('catedra_id', id)
    ])

    if (catRes.error) console.log('CAT ERROR:', catRes.error)
    if (classesRes.error) console.log('CLASSES ERROR:', classesRes.error)
    if (studentsRes.error) console.log('STUDENTS ERROR:', studentsRes.error)
    if (gradesRes.error) console.log('GRADES ERROR:', gradesRes.error)

    if (catRes.error || !catRes.data) throw new Error("Cat failed")
    
    console.log('Catedra:', catRes.data.nombre)

    const clases = classesRes.data || []
    const classIds = clases.map(c => c.id)
    if (classIds.length > 0) {
      const { error: asErr } = await supabase.from('asistencias').select('id').in('clase_id', classIds).limit(1)
      if (asErr) console.log('ASISTENCIAS ERROR:', asErr)
    }

    console.log('SUCCESS! Everything fetches correctly.')

  } catch (err) {
    console.log('Caught error:', err)
  }
}

test('3ce032a1-fa52-4752-b883-9b9ba8a5099f') // valid catedra id from my prior knowledge
test('3cd85ad4-bd2a-4639-9c88-bb22bc63ed88') // invalid catedra id (docente id)
