const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these in your Vercel project settings under Environment Variables');
  // Don't exit in serverless, but log the error
}

// DB
const connectDB = require('./db');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const companyRoutes = require('./routes/companyRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const activityRoutes = require('./routes/activityRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const leadRoutes = require('./routes/leadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const importRoutes = require('./routes/importRoutes');

// Error middleware
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

// Connect DB (with error handling for serverless)
try {
  connectDB();
} catch (error) {
  console.error('Database connection failed:', error.message);
}

const app = express();

/* ---------------- SECURITY ---------------- */
app.use(helmet());

/* ---------------- CORS (VERY IMPORTANT) ---------------- */
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Preflight support (FIXES YOUR ERROR)
app.options('*', cors());

/* ---------------- BODY PARSER ---------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ---------------- LOGGING ---------------- */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ---------------- RATE LIMIT ---------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

/* ---------------- HEALTH CHECK ---------------- */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM API is running',
    env: process.env.NODE_ENV || 'development'
  });
});

/* ---------------- ROUTES ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/import', importRoutes);

/* ---------------- ERRORS ---------------- */
app.use(notFound);
app.use(errorHandler);

/* For local development */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/* ❌ DO NOT LISTEN ON VERCEL */
module.exports = app;
