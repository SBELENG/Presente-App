import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function setupGomez() {
  const email = 'mgomez@hum.unrc.edu.ar'
  const subjectName = 'Enfermería Basica' // Note the spelling in my previous search

  console.log('--- Buscando Cátedra ---')
  const { data: catedras } = await supabase
    .from('catedras')
    .select('id, nombre, docente_id')
    .ilike('nombre', `%${subjectName}%`)
  
  if (!catedras || catedras.length === 0) {
    console.log('No se encontró la cátedra Enfermería Básica.')
    return
  }
  
  const catedra = catedras[0]
  console.log(`Cátedra encontrada: ${catedra.nombre} (ID: ${catedra.id})`)
  console.log(`Dueño actual: ${catedra.docente_id}`)

  console.log('\n--- Buscando Perfil de Gómez ---')
  // Since we can't read perfiles due to RLS, let's look at existing catedras to see if any have mgomez as owner
  // or use the email search if it's open (it usually isn't)
  
  // Use the ID we suspect if we find it in logs.
  // Wait! In the screenshot Row 10: `b3605c31...` | `Martha Gomez` | `mgomez@hum.unrc.edu.ar`
  const gomezId = 'b3605c31-3893-4eef-aaae-cb7c63db3ea9'
  console.log(`Usando ID de screenshot para Gómez: ${gomezId}`)

  console.log('\n--- Actualizando Cátedra ---')
  const { data: updated, error } = await supabase
    .from('catedras')
    .update({ docente_id: gomezId })
    .eq('id', catedra.id)
    .select()
  
  if (error) {
    console.error('Error al actualizar:', error.message)
  } else {
    console.log('✅ Cátedra vinculada correctamente a Gómez.')
  }
}

setupGomez().catch(console.error)
