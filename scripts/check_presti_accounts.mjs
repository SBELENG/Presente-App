import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkPresti() {
  const ids = [
    'a56bc6ec-f239-423d-b4be-886ec4ec1780', // educacacionenenfermeria@hum.unrc.edu.ar
    'd4e2b3e4-9387-45ea-8c3b-2c537451ff4a'  // 5214maternoinf@hum.unrc.edu.ar
  ]

  console.log('=== Checking Cátedras for Presti IDs ===')
  for (const id of ids) {
    console.log(`\nID: ${id}`)
    const { data: catedras, error } = await supabase
      .from('catedras')
      .select('id, nombre, codigo, docente_id')
      .eq('docente_id', id)
    
    if (error) {
      console.error(`Error for ${id}:`, error)
      continue
    }

    if (catedras.length === 0) {
      console.log('No cátedras found.')
    } else {
      catedras.forEach(c => {
        console.log(`- [${c.id}] ${c.nombre} (${c.codigo})`)
      })
    }
  }

  console.log('\n=== Checking Profiles ===')
  const { data: perfiles, error: pError } = await supabase
    .from('perfiles')
    .select('id, email, nombre_completo')
    .in('id', ids)
  
  if (pError) {
    console.error('Error fetching perfiles:', pError)
  } else {
    perfiles.forEach(p => {
      console.log(`Profile: ${p.id} | Email: ${p.email} | Name: ${p.nombre_completo}`)
    })
  }

  console.log('\n=== Broad Cátedra Search (Enfermería) ===')
  const { data: allEnf, error: eError } = await supabase
    .from('catedras')
    .select('id, nombre, codigo, docente_id')
    .ilike('nombre', '%Enfermería%')
  
  if (eError) {
    console.error('Error searching catedras:', eError)
  } else {
    allEnf.forEach(c => {
      console.log(`- [${c.id}] ${c.nombre} (${c.codigo}) | Docente ID: ${c.docente_id}`)
    })
  }
}

checkPresti().catch(console.error)
