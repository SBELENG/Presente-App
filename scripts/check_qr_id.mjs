import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  const ebQr = '0179cff5-65c8-449d-8b52-421f261b6f93'
  const { data } = await supabase.from('clases').select('*').eq('id', ebQr)
  console.log('Match para Cátedra QR in clases:', data)
  
  const { data: asistencias } = await supabase.from('asistencias').select('*').eq('clase_id', ebQr)
  console.log('Asistencias para Cátedra QR:', asistencias?.length || 0)
}

check().catch(console.error)
