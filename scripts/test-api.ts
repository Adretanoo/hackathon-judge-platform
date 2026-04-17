import { buildApp } from '../src/server';

async function test() {
  const app = await buildApp();
  try {
    // Fake req user
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (req) => {
      (req as any).user = { sub: 'cmo29yyra0002gmwcyumgh50g' }; // Organizer test user
    });
    
    // Send a payload
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: {
        authorization: 'Bearer anything' // bypass jwt since we mocked user if we disabled auth
      },
      payload: {
        teamId: 'cmo29zs3x000bgmwc705sbke9',
        title: 'test title',
      }
    });

    console.log("STATUS:", res.statusCode);
    console.log("BODY:", res.body);
  } catch(e) {
    console.error(e);
  } finally {
    app.close();
  }
}

test();
