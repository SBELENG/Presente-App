import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kcbzgbronxrdznxzwssr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI'
)

async function inspectSchema() {
  console.log('--- Inspecting working profile for schema ---')
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching profile:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]))
    console.log('Sample data:', data[0])
  } else {
    console.log('No profiles found in the table at all.')
  }
}

inspectSchema().catch(console.error)
