import { PrismaClient } from '@prisma/client';

async function testAuth() {
  const prisma = new PrismaClient();
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log(`Registering ${email}...`);
  try {
    const regRes = await fetch('http://127.0.0.1:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password,
        username: `testuser_${Date.now()}`,
        fullName: 'Test User'
      })
    });
    const regData: any = await regRes.json();
    console.log('Register Res Status:', regRes.status);
    console.log('Register Res Data:', regData);

    console.log(`\nLogging in ${email}...`);
    const res = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data: any = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);

    if (data.data?.accessToken) {
        const checkRes = await fetch('http://127.0.0.1:3000/api/v1/users/me', {
            headers: { Authorization: `Bearer ${data.data?.accessToken}` }
        });
        const checkData: any = await checkRes.json();
        console.log('Me endpoint success:', checkData.success);
    }
  } catch (err) {
      console.error(err);
  }
  process.exit(0);
}

testAuth();
