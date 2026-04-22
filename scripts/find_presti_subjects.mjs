import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function findMoreSubjects() {
  console.log('=== Checking all Cátedras ===')
  const { data: catedras, error } = await supabase
    .from('catedras')
    .select('id, nombre, codigo, docente_id')
  
  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${catedras.length} subjects.`)
  
  // Try to find subjects related to Presti or common keywords
  const keywords = ['Presti', 'Trinidad', 'Materno', 'Infantil', 'Educación', 'Enfermería']
  const matches = catedras.filter(c => 
    keywords.some(k => c.nombre?.toLowerCase().includes(k.toLowerCase()))
  )

  console.log('\nPotential subjects for Presti:')
  matches.forEach(c => {
    console.log(`- [${c.id}] ${c.nombre} (${c.codigo}) | Docente ID: ${c.docente_id}`)
  })

  console.log('\nChecking if Docente IDs are emails...')
  matches.forEach(c => {
    if (c.docente_id && c.docente_id.includes('@')) {
       console.log(`  ALERT: ${c.nombre} has an email as docente_id: ${c.docente_id}`)
    }
  })
}

findMoreSubjects().catch(console.error)
