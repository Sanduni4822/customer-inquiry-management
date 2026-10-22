import { app } from './app';
import { env } from './config/env';
import { pool } from './config/db';

const server = app.listen(env.PORT, () => {
  console.log(`☕ Coffee Ninja API running on http://localhost:${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
});

const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('PostgreSQL pool disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
