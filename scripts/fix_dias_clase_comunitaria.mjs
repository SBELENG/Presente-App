import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEDRA_ID = '898780dd-5831-4f57-b376-f540cb241cff'

async function fix() {
  const { data, error } = await supabase
    .from('catedras')
    .update({ dias_clase: ['lunes'] })
    .eq('id', CATEDRA_ID)
    .select('id, nombre, dias_clase')
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    console.log('\nSQL manual a ejecutar en Supabase:')
    console.log(`UPDATE catedras SET dias_clase = '["lunes"]' WHERE id = '${CATEDRA_ID}';`)
  } else {
    console.log('✅ dias_clase actualizado correctamente:')
    console.log(`   Cátedra: ${data.nombre}`)
    console.log(`   dias_clase: ${JSON.stringify(data.dias_clase)}`)
  }
}

fix().catch(console.error)
