import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  const { data: insc } = await supabase.from('inscripciones').select('catedra_id').eq('apellido_estudiante', 'Arguello').limit(1)
  console.log("CATEDRA DE ARGUELLO:", insc)

  const { data: cat } = await supabase.from('catedras').select('nombre').eq('id', insc[0].catedra_id).single()
  console.log("NOMBRE DA CATEDRA:", cat.nombre)
}

test()
