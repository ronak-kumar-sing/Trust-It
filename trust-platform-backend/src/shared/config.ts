import { z } from 'zod';

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

  // Firebase (optional — stubs used if missing)
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
});

/** Validated environment variable types */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Loads and validates environment variables from process.env.
 * Exits the process with a clear error if validation fails.
 *
 * @returns Validated environment configuration
 * @throws Exits process with code 1 on validation failure
 */
export function loadConfig(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}
