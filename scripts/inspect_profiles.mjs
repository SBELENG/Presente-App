import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function inspectProfiles() {
  console.log('=== Checking profiles table ===')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching from profiles:', error)
  } else {
    console.log('Sample profiles:', data)
  }

  console.log('\n=== Checking profiles for Presti email EDU ===')
  const { data: presti1, error: e1 } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'educacacionenenfermeria@hum.unrc.edu.ar')
  
  if (e1) console.error('Error e1:', e1)
  else console.log('Presti 1:', presti1)

  console.log('\n=== Checking profiles for Presti email MATERNO ===')
  const { data: presti2, error: e2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', '5214maternoinf@hum.unrc.edu.ar')
  
  if (e2) console.error('Error e2:', e2)
  else console.log('Presti 2:', presti2)
}

inspectProfiles().catch(console.error)
