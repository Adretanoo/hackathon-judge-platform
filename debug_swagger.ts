import { buildApp } from './src/server';

async function main() {
  const app = await buildApp();
  await app.ready();
  
  console.log("App ready, injecting request to /documentation/json...");

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/documentation/json'
    });
    console.log("Status:", res.statusCode);
    if (res.statusCode >= 400) {
      console.log(res.payload);
    } else {
      console.log("Success! Swagger JSON generated.");
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

main().catch(console.error);
