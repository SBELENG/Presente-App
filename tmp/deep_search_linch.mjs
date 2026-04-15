import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function findLinch() {
  const tables = ['docentes', 'usuarios', 'perfiles', 'profiles']
  
  for (const table of tables) {
    console.log(`\n--- Searching in ${table} ---`)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.log(`Error in ${table}:`, error.message)
    } else {
      console.log(`${table} recent entries:`, data)
      // Check for Linch in text fields if any
      const matching = data.filter(item => JSON.stringify(item).toLowerCase().includes('linch'))
      if (matching.length > 0) {
        console.log(`MATCH FOUND in ${table}:`, matching)
      }
    }
  }
}

findLinch()
