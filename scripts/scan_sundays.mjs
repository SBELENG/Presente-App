import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function findSundays() {
  const { data, error } = await supabase.from('clases').select('*, catedras(nombre)')
  if (error) { console.error(error); return }
  
  const sundays = data.filter(c => {
    const d = new Date(c.fecha + 'T12:00:00').getDay()
    return d === 0
  })

  console.log(`--- DOMINGOS ENCONTRADOS: ${sundays.length} ---`)
  sundays.forEach(h => {
    console.log(`${h.fecha} | ${h.tema} | ${h.estado_clase} | Cátedra: ${h.catedras?.nombre}`)
  })
}

findSundays()
