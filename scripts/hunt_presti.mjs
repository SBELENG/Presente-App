import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function huntPresti() {
  const emails = [
    'educacacionenenfermeria@hum.unrc.edu.ar', // typo
    'educacionenenfermeria@hum.unrc.edu.ar',   // correct
    '5214maternoinf@hum.unrc.edu.ar',
    'trinidadpresti@hum.unrc.edu.ar',
    'trinidadprestti@hum.unrc.edu.ar'
  ]

  console.log('=== Hunting for Presti Profiles ===')
  for (const email of emails) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
    
    if (error) {
      console.log(`Error checking ${email}: ${error.message}`)
      continue
    }

    if (data && data.length > 0) {
      console.log(`FOUND matches for ${email}:`)
      data.forEach(p => console.log(`- ID: ${p.id} | Email: ${p.email} | Name: ${p.nombre} ${p.apellido}`))
    } else {
      console.log(`No profile found for ${email}`)
    }
  }

  // Also check if any profile has "Trinidad" or "Presti" in name fields
  console.log('\n=== Checking by name ===')
  // Try common table columns
  const fields = ['nombre', 'apellido', 'nombre_completo', 'full_name']
  for (const field of fields) {
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .ilike(field, '%Trinidad%')
     
     if (data && data.length > 0) {
       console.log(`Matches by ${field} (Trinidad):`)
       data.forEach(p => console.log(`- ID: ${p.id} | Email: ${p.email} | Name: ${p.nombre} ${p.apellido}`))
     }
  }
}

huntPresti().catch(console.error)
