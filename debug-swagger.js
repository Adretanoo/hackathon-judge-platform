require('./src/server').buildApp().then(app => { app.ready().then(() => { try { console.log(JSON.stringify(app.swagger(), null, 2)); } catch(err) { console.error(err); } process.exit(0); }); });
