const https = require('https');

https.get('https://presente-app-nine.vercel.app/login', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // extract SUPABASE_URL if embedded in the HTML or JS scripts
    const match = data.match(/https:\/\/(.*?)\.supabase\.co/);
    if(match) console.log("Vercel uses Supabase URL:", match[0]);
    else console.log("No supabase URL found directly in HTML body.");
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
