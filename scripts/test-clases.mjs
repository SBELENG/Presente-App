import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConflict() {
  const { data: insc } = await supabase.from('inscripciones').select('*').limit(1)

  const { error } = await supabase
    .from('notas')
    .upsert([{
      inscripcion_id: insc[0].id,
      catedra_id: insc[0].catedra_id,
      tipo: 'parcial_1',
      valor: 6
    }], { onConflict: 'inscripcion_id, tipo' })
    
  console.log("Error con (inscripcion_id, tipo):", error)
}
testConflict()
