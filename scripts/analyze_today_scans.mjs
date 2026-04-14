import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const classId = '56c7780e-6f2c-46bc-bb67-fa0dce0b08be'
  const { data: asist } = await supabase
    .from('asistencias')
    .select('created_at')
    .eq('clase_id', classId)
    .gte('created_at', '2026-04-08T00:00:00Z')
    .order('created_at', { ascending: true })

  if (asist.length > 0) {
    console.log(`Primer registro hoy: ${asist[0].created_at}`)
    console.log(`Último registro hoy: ${asist[asist.length-1].created_at}`)
    console.log(`Total: ${asist.length}`)
  } else {
    console.log('No registros hoy for this class.')
  }
}

check().catch(console.error)
