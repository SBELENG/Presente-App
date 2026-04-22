import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkBloques() {
  const ids = [
    '7dee9248-ddfb-4591-b19c-c2cb24f9250d', // Educación
    'bfd1db71-62d1-403b-a8ca-42d1fae2ecdc'  // Materno
  ]

  const { data, error } = await supabase
    .from('catedras')
    .select('id, nombre, bloques_semanales, comisiones_division, dias_clase, dias_practica')
    .in('id', ids)
  
  if (error) console.error(error)
  else {
    data.forEach(c => {
      console.log(`Cátedra: ${c.nombre}`)
      console.log(`- bloques_semanales: ${JSON.stringify(c.bloques_semanales)} (Type: ${typeof c.bloques_semanales}, IsArray: ${Array.isArray(c.bloques_semanales)})`)
      console.log(`- comisiones_division: ${JSON.stringify(c.comisiones_division)}`)
      console.log(`- dias_clase: ${JSON.stringify(c.dias_clase)}`)
      console.log(`- dias_practica: ${JSON.stringify(c.dias_practica)}`)
      console.log('---')
    })
  }
}

checkBloques().catch(console.error)
