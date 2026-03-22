import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { applicationsRouter } from './routes/applications';
import { authRouter } from './routes/auth';
import { UPLOAD_DIR } from './services/storage.service';

dotenv.config();

const app = express();

// ── Security & utilities ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.set('trust proxy', 1);



app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /\.onrender\.com$/,   // allow any onrender.com subdomain
    ];
    if (!origin) return callback(null, true); // non-browser / server requests
    const ok = allowed.some((a) =>
      typeof a === 'string' ? a === origin : a.test(origin)
    );
    callback(ok ? null : new Error('Not allowed by CORS'), ok);
  },
  credentials: true,
}));


app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve uploaded files ──────────────────────────────────────────────────────
// Render persistent disk mounts at /var/data; locally uses ./uploads
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
 });

 

app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
// submitLimiter applies ONLY to public POST (model submissions), not admin GET routes
app.post('/api/applications', submitLimiter);
app.use('/api/applications', applicationsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'IBH Backend', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 IBH Backend running on http://localhost:${PORT}`);
  console.log(`   Upload dir:  ${UPLOAD_DIR}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
