import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    FRONTEND_URL: z.url().default("http://localhost:3000"),
    REDIS_URL: z.url().default("redis://localhost:6379"),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
    RESEND_FROM_EMAIL: z.string().min(1, "RESEND_FROM_EMAIL is required"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    UPLOADTHING_TOKEN: z.string().min(1),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    const issues = parsedEnv.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");

    throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsedEnv.data;
