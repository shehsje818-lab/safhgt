import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { config, validateConfig } from './config/config.js';
import './config/passport.js';
import authRouter from './routes/auth.js';
import applicationsRouter from './routes/applications.js';
import adminRouter from './routes/admin.js';

const app = express();

// Validate config
try {
  validateConfig();
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: any) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware - CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
}));

// Explicit OPTIONS handler
app.options('*', cors());

app.use(express.json());

app.use(session({
  secret: config.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req: any, res: any) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${config.SERVER_PORT}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
});
