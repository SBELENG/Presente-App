import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debug() {
  const { data: allAsist } = await supabase.from('asistencias').select('id, inscripcion_id, clase_id, clases(fecha, catedra_id)')
  const { data: allInsc } = await supabase.from('inscripciones').select('id')
  const inscIds = new Set(allInsc.map(i => i.id))
  
  const orphans = allAsist.filter(a => !inscIds.has(a.inscripcion_id))
  
  const orphansByDate = {}
  orphans.forEach(o => {
    const date = o.clases?.fecha || 'unknown'
    orphansByDate[date] = (orphansByDate[date] || 0) + 1
  })
  
  console.log("Orphans by class date:", orphansByDate)
}

debug().catch(console.error)
