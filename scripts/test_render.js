const http = require('http');

setTimeout(() => {
  http.get('http://localhost:3000/docente/catedras/f1f38978-b2cc-428f-8675-6af8be29b93d/estadisticas', (res) => {
    console.log('STATUS:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Length:', data.length, data.slice(0, 100)));
  }).on('error', err => console.error(err));
}, 5000); // give Next.js 5s to stand up
