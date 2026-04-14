import { PrismaClient } from '@prisma/client';


async function testRefresh() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  try {
    // 1. Login to get the cookie
    const loginRes = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'password123' })
    });
    
    // Extract set-cookie
    const setCookieHeader = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie Header:', setCookieHeader);
    
    let cookie = '';
    if (setCookieHeader) {
      cookie = setCookieHeader.split(';')[0];
    }
    console.log('Extracted cookie:', cookie);

    // 2. Refresh using the cookie
    const refreshRes = await fetch('http://127.0.0.1:3000/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': cookie
      }
    });

    const data = await refreshRes.json();
    console.log('Refresh response:', refreshRes.status, data);
    
  } catch (err: any) {
    console.error('Refresh Failed!', err);
  }

  process.exit(0);
}

testRefresh();
