import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debugCatedra(id) {
  const { data: cat } = await supabase.from('catedras').select('*').eq('id', id).single()
  
  if (!cat) { console.log('No catedra found'); return; }
  console.log(`--- DEBUG CATEDRA: ${cat.nombre} ---`)
  console.log(`Días: ${cat.dias_clase} | Práctica: ${cat.dias_practica}`)
  
  const { data: cls } = await supabase.from('clases').select('*').eq('catedra_id', id).order('fecha')
  cls.forEach(c => {
    const d = new Date(c.fecha + 'T12:00:00').getDay()
    console.log(`${c.fecha} (Día ${d}) | ${c.estado_clase} | ${c.tema}`)
  })
}

debugCatedra('3cd85ad4-bd2a-4639-9c88-bb22bc63ed88')
