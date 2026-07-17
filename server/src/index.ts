import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { assistantRouter } from './features/assistant/router.js';
import { operationsRouter } from './features/operations/router.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Security Hardening ────────────────────────────────────────────────────────

/**
 * Helmet: sets protective HTTP security headers.
 * CSP is explicitly configured — only allows resources from 'self', Google Fonts,
 * and the Gemini API CDN. Inline scripts are blocked.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    }
  }
}));

/**
 * CORS: strictly restrict to the known client origin.
 * Configured via ALLOWED_ORIGIN env variable — defaults to localhost:5173 for dev.
 */
app.use(cors({
  origin: config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-gemini-key'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '100kb' })); // JSON payload cap

// ── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * Global limiter: 120 requests per minute per IP across all API routes.
 * Prevents automated scraping and general endpoint abuse.
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' }
});

/**
 * AI endpoint limiter: stricter 10 requests per minute per IP.
 * Protects against Gemini API quota exhaustion and cost-abuse.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation limit reached (10/min). Please wait before generating another report.' }
});

app.use('/api', globalLimiter);

// ── API Routing ───────────────────────────────────────────────────────────────

// Apply strict AI limiter to generative endpoints only
app.use('/api/assistant/ask', aiLimiter);
app.use('/api/operations/briefing', aiLimiter);
app.use('/api/operations/sop', aiLimiter);

app.use('/api/assistant', assistantRouter);
app.use('/api/operations', operationsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    mode: config.GEMINI_API_KEY ? 'live' : 'simulation'
  });
});

// ── Static File Serving ───────────────────────────────────────────────────────

// Serve React Client build output in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to React index.html for SPA client routing
app.get(/^\/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ── Global Error Boundary ─────────────────────────────────────────────────────

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'An unexpected server error occurred.';
  console.error('🔥 Server Error Boundary Caught:', err);
  res.status(500).json({ error: message });
});

app.listen(config.PORT, () => {
  console.log(`🚀 ArenaPulse backend listening on port ${config.PORT} [Mode: ${config.GEMINI_API_KEY ? 'LIVE' : 'SIMULATION'}]`);
});
