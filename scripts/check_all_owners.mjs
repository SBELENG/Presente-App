import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkAllCatedras() {
  const { data: catedras } = await supabase.from('catedras').select('id, nombre, docente_id')
  for (const c of catedras) {
    console.log(`Cátedra: ${c.nombre.padEnd(40)} | Docente ID: ${c.docente_id}`)
  }
}

checkAllCatedras().catch(console.error)
