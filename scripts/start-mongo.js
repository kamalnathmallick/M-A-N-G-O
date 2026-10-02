/**
 * Local MongoDB for MangoSense development/testing.
 *
 * Most machines (and CI) do not have MongoDB installed, and the backend must
 * still boot without one (it falls back to flagged demo data). This script
 * starts a real, ephemeral MongoDB on the default port so the DB-ONLINE paths
 * — persistence, ownership checks, seeded demo data — can be tested for real.
 *
 * Requires the root devDependency `mongodb-memory-server` (downloads a mongod
 * binary on first run; cached afterwards).
 *
 * Usage:  npm run start:mongo            (port 27017, the default)
 *         MONGO_PORT=27099 npm run start:mongo
 * Stop:   Ctrl+C (the data directory is temporary and is cleaned up)
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = Number(process.env.MONGO_PORT || 27017);

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, ip: '127.0.0.1', dbName: 'mangosense' }
  });
  console.log('MONGO_READY ' + mongod.getUri());
  console.log('Keep this terminal open. Press Ctrl+C to stop.');

  const shutdown = async () => {
    try {
      await mongod.stop();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process alive until interrupted.
  setInterval(() => {}, 1 << 30);
})().catch((e) => {
  console.error('MONGO_FAIL', e.message);
  process.exit(1);
});
