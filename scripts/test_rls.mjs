import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
  console.log('Fetching catedras with ANON...')
  const { data, error } = await supabase.from('catedras').select('*').limit(3)
  console.log('Cat Error:', error?.message)
  console.log('Cat Data count:', data?.length)

  console.log('Fetching notas with ANON...')
  const { data: ns, error: nsErr } = await supabase.from('notas').select('*').limit(3)
  console.log('Notas Error:', nsErr?.message)
  console.log('Notas Data count:', ns?.length)
}

test()
