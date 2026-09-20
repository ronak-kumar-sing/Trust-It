import { loadConfig } from './shared/config.js';
import { buildApp } from './app.js';

/**
 * Main server entry point.
 * Loads config, builds the Fastify app, and starts listening.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    app.log.info(
      `🚀 Trust Platform API running on http://localhost:${config.PORT}`,
    );
    app.log.info(`📋 Environment: ${config.NODE_ENV}`);
    app.log.info(`❤️  Health check: http://localhost:${config.PORT}/api/v1/health`);
  } catch (error) {
    app.log.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }

  // ── Graceful Shutdown ───────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      app.log.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
