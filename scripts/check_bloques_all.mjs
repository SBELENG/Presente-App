import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function checkAllBloques() {
  const { data: catedras } = await supabase.from('catedras').select('id, nombre, bloques_semanales')
  
  if (!catedras) return
  
  console.log('=== Checking Bloques Semanales across all Cátedras ===')
  for (const c of catedras) {
    if (c.bloques_semanales && !Array.isArray(c.bloques_semanales)) {
       console.log(`Mismatch in ${c.nombre} (${c.id}): Type is ${typeof c.bloques_semanales}, value is ${JSON.stringify(c.bloques_semanales)}`)
    }
  }
}

checkAllBloques().catch(console.error)
