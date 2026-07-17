import { z } from "zod";
import dotenv from "dotenv";

// Load environmental variables
dotenv.config();

const configSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("8080"),
  GEMINI_API_KEY: z.string().optional(),
  /** Allowed origin for CORS. Defaults to Vite dev server for local development. */
  ALLOWED_ORIGIN: z.string().default("http://localhost:5173"),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "❌ Environment configuration validation failed:",
    result.error.format(),
  );
  process.exit(1);
}

export const config = result.data;
