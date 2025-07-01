import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),
  ORS_API_KEY: z.string().min(1, 'ORS_API_KEY is required'),
  PORT: z.string().optional().default('3000'),
  DELAY_THRESHOLD_MINUTES: z.string().optional().default('10'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.errors.forEach((err) => {
    console.error(`- ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}
const env = parsed.data;

export const config = {
  openaiApiKey: env.OPENAI_API_KEY,
  sendgridApiKey: env.SENDGRID_API_KEY,
  orsApiKey: env.ORS_API_KEY,
  port: parseInt(env.PORT, 10),
  delayThresholdMinutes: parseInt(env.DELAY_THRESHOLD_MINUTES, 10),
};
