import { z } from "zod";

const retailCrmEnvSchema = z.object({
  RETAILCRM_URL: z.string().url().optional(),
  RETAILCRM_API_KEY: z.string().min(1).optional(),
  RETAILCRM_SITE: z.string().min(1).optional(),
  RETAILCRM_ORDER_TYPE: z.string().min(1).optional(),
  RETAILCRM_ORDER_METHOD: z.string().min(1).optional(),
});

const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const telegramEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_CHAT_ID: z.string().min(1).optional(),
});

const appEnvSchema = z.object({
  ALERT_MIN_TOTAL: z.coerce.number().default(50000),
  CRON_SECRET: z.string().min(16).optional(),
});

const optionalEnvSchema = retailCrmEnvSchema
  .merge(supabaseEnvSchema)
  .merge(telegramEnvSchema)
  .merge(appEnvSchema);

const requiredEnvSchema = optionalEnvSchema.extend({
  RETAILCRM_URL: z.string().url(),
  RETAILCRM_API_KEY: z.string().min(1),
  RETAILCRM_SITE: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
});

export type OptionalEnv = z.infer<typeof optionalEnvSchema>;
export type RequiredEnv = z.infer<typeof requiredEnvSchema>;

export function getOptionalEnv(): OptionalEnv {
  return optionalEnvSchema.parse(process.env);
}

export function requireRetailCrmEnv() {
  return retailCrmEnvSchema.extend({
    RETAILCRM_URL: z.string().url(),
    RETAILCRM_API_KEY: z.string().min(1),
    RETAILCRM_SITE: z.string().min(1),
  }).parse(process.env);
}

export function requireSupabaseEnv() {
  return supabaseEnvSchema.extend({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  }).parse(process.env);
}

export function requireTelegramEnv() {
  return telegramEnvSchema.extend({
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_CHAT_ID: z.string().min(1),
  }).parse(process.env);
}

export function getMissingServerEnv(): string[] {
  const env = getOptionalEnv();

  return [
    "RETAILCRM_URL",
    "RETAILCRM_API_KEY",
    "RETAILCRM_SITE",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
  ].filter((key) => !env[key as keyof OptionalEnv]);
}

export function requireServerEnv(): RequiredEnv {
  return requiredEnvSchema.parse(process.env);
}
