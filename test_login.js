import fetch from 'node:http';
// Simple test script
const body = JSON.stringify({ email: 'admin@c2s.edu', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = import('node:http').then(http => {
  return new Promise((resolve, reject) => {
    const req = http.default.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
});

req.then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
