const http = require('http');
const data = JSON.stringify({
  nom: 'Dubois',
  prenom: 'Emma',
  email: 'emma.dubois@email.fr',
  telephone: '0655443322',
  statut: 'نشط',
  adresse: 'Rue test',
  specialite: 'علوم',
  classe_section: '1A',
  date_adhesion: '2026-07-29',
  Photo_B64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAtEB9y+iH4AAAAASUVORK5CYII=',
});
const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/adherents/3',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(opts, (res) => {
  console.log('STATUS', res.statusCode);
  let d = '';
  res.on('data', (c) => (d += c));
  res.on('end', () => {
    console.log('BODY', d);
  });
});
req.on('error', (e) => console.error('ERR', e.message));
req.write(data);
req.end();
