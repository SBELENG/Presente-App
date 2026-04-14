import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const { data: catedra } = await supabase
    .from('catedras')
    .select('*')
    .eq('id', 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e')
    .single()

  console.log('Cátedra:', JSON.stringify(catedra, null, 2))

  const { data: comisiones } = await supabase
    .from('comisiones')
    .select('*')
    .eq('catedra_id', 'e5bcb9b1-5c3d-49b0-a60b-a3b914c1c50e')

  console.log('Comisiones:', JSON.stringify(comisiones, null, 2))
}

check().catch(console.error)
