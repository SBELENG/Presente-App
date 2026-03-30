import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function findHolidays() {
  console.log('Buscando feriados...')
  const { data, error } = await supabase
    .from('clases')
    .select('*, catedras(nombre)')
    .ilike('tema', '%FERIADO%')
    
  if (error) { console.error('Error:', error); return }
  
  if (!data || data.length === 0) {
     console.log('No se encontraron feriados con ese nombre.')
     return
  }
  
  console.log(`--- SE ENCONTRARON ${data.length} REGISTROS ---`)
  data.forEach(c => {
    console.log(`${c.tema} | ${c.fecha} | Cátedra: ${c.catedras?.nombre} (ID: ${c.catedra_id})`)
  })
}

findHolidays()
