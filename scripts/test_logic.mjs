import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testLogic() {
  const { data: clases } = await supabase.from('clases').select('*, asistencias(id)')
  
  clases.forEach(c => {
    const d = new Date(c.fecha + 'T12:00:00').getDay()
    const asistCount = c.asistencias ? c.asistencias.length : 0
    console.log(`FECHA: ${c.fecha} | DIA: ${d} | ASIST: ${asistCount} | ESTADO: ${c.estado_clase} | ID: ${c.id}`)
  })
}

testLogic()
