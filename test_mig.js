(async () => {
  const loginRes = await fetch('https://c2s-vlsi-portal.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@c2s.edu', password: 'admin123' })
  });
  const data = await loginRes.json();
  const token = data.token;
  const res = await fetch('https://c2s-vlsi-portal.vercel.app/api/pcs/migrate-db', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log(await res.json());
})();
