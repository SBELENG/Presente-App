import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fetchSummary() {
  const { data, error } = await supabase.from('clases').select('*, catedras(id, nombre, dias_clase)')
  if (error) { console.error(error); return }
  
  const badHolidays = data.filter(c => {
    if (c.estado_clase === 'normal') return false
    const d = new Date(c.fecha + 'T12:00:00').getDay()
    const valid = (c.catedras?.dias_clase || []).map(dc => ({'lunes':1,'martes':2,'miercoles':3,'jueves':4,'viernes':5,'sabado':6,'domingo':0}[dc]))
    return !valid.includes(d)
  })

  console.log(`--- BAD HOLIDAYS: ${badHolidays.length} ---`)
  badHolidays.forEach(h => {
    console.log(`${h.fecha} (D ${new Date(h.fecha + 'T12:00:00').getDay()}) | ${h.tema} | Cátedra: ${h.catedras?.nombre} (${h.catedra_id})`)
  })
}

fetchSummary()
