import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Environment variable schema.
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages if any are missing or invalid.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis (BullMQ)
  REDIS_URL: z.string().min(1),

  // Razorpay (optional in development — stubs used if missing)
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),

  // Firebase (optional — stubs and fallback used if missing)
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

/** Validated environment variable types */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Loads and validates environment variables from process.env and local env files.
 * Automatically attempts to load `.env.local` or `.env` if present.
 * In development mode, populates developer defaults for local preview if variables are unset.
 * Exits the process with a clear error if validation fails in production.
 *
 * @returns Validated environment configuration
 * @throws Exits process with code 1 on validation failure
 */
export function loadConfig(): Env {
  // Automatically load local environment files
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        }
      } catch {
        // Ignored if file format differs or environment is restricted
      }
    }
  }

  const env = { ...process.env };
  const nodeEnv = env.NODE_ENV ?? 'development';

  // In development and test modes, provide development defaults if unset
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    if (!env.SUPABASE_URL) env.SUPABASE_URL = 'https://mock.supabase.co';
    if (!env.SUPABASE_ANON_KEY) env.SUPABASE_ANON_KEY = 'mock-anon-key-dev';
    if (!env.SUPABASE_SERVICE_ROLE_KEY) env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-dev';
    if (!env.REDIS_URL) env.REDIS_URL = 'redis://localhost:6379';
  }

  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}
