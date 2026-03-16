const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://kcbzgbronxrdznxzwssr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  try {
    const { data: catedras, error: cErr } = await supabase.from('catedras').select('id').limit(1)
    if (cErr) {
        console.error('Error fetching catedras:', cErr)
        return
    }
    if (!catedras || catedras.length === 0) {
      console.error('No hay catedras creadas')
      return
    }
    const cid = catedras[0].id
    console.log('Probando insert en catedra:', cid)

    const { error } = await supabase.from('inscripciones').insert({
      catedra_id: cid,
      dni_estudiante: '12345678',
      nombre_estudiante: 'Test',
      apellido_estudiante: 'User',
      estado: 'inscripto'
    })

    if (error) {
      console.error('ERROR DETALLADO:', JSON.stringify(error, null, 2))
    } else {
      console.log('Insert exitoso!')
    }
  } catch (e) {
      console.error('CATCH ERROR:', e)
  }
}
debug()
