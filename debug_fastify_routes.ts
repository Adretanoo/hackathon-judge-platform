import { buildApp } from './src/server';
import { zodToJsonSchema } from 'zod-to-json-schema';

async function main() {
  const app = await buildApp();
  const schemas: any[] = [];
  
  app.addHook('onRoute', (routeOptions: any) => {
    schemas.push({ url: routeOptions.url, schema: routeOptions.schema, method: routeOptions.method });
  });

  await app.ready();

  let failed = false;
  for (const s of schemas) {
    if (!s.schema) continue;
    for (const key of ['body', 'querystring', 'params', 'headers']) {
      if (s.schema[key]) {
        try {
          zodToJsonSchema(s.schema[key]);
        } catch (e) {
          console.error(`ERROR IN ${s.method} ${s.url} -> ${key}`);
          failed = true;
        }
      }
    }
    if (s.schema.response) {
      for (const code in s.schema.response) {
        try {
          let r = s.schema.response[code];
          if (r.properties) r = r.properties;
          if (r.safeParse) zodToJsonSchema(r);
        } catch (e) {
          console.error(`ERROR IN ${s.method} ${s.url} -> response ${code}`);
          failed = true;
        }
      }
    }
  }

  if (!failed) {
    console.log('NO ROUTES FAILED DIRECT SCHEMA CONVERSION!');
  }
}

main().catch(console.error);
