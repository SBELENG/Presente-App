import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://kcbzgbronxrdznxzwssr.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnpnYnJvbnhyZHpueHp3c3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTk5NjksImV4cCI6MjA4ODg5NTk2OX0.L1PYmuqh3bggwp2yRQ2l48CX3nzMna6UtZJbAkJi0kI"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkRecent() {
  console.log("Checking for profiles created after 2026-04-14T00:00:00Z...")
  const { data: perfiles, error } = await supabase
    .from('perfiles')
    .select('*')
    .gte('created_at', '2026-04-14T00:00:00Z')
  
  if (error) {
    console.log("Error querying perfiles:", error.message)
  } else {
    console.log("Recent perfiles:", perfiles)
  }
}

checkRecent()
