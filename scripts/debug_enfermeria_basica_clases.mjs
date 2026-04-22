import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function check() {
  const catId = 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e'
  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('catedra_id', catId)
    .order('fecha', { ascending: false })
  
  console.log(`Total clases para Enfermería Básica: ${clases?.length || 0}`)
  console.log('\nÚltimas 5 clases:')
  clases?.slice(0, 5).forEach(c => {
    console.log(`- Fecha: ${c.fecha}, ID: ${c.id}, Creada: ${c.created_at}`)
  })
}

check().catch(console.error)
