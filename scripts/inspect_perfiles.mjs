import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function inspectPerfiles() {
  console.log('=== Checking perfiles table ===')
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching from perfiles:', error)
  } else {
    console.log('Sample perfiles:', data)
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]))
    }
  }
}

inspectPerfiles().catch(console.error)
