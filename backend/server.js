require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const logRoutes = require('./routes/logRoutes');

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Global Security Middlewares
app.use(helmet()); // Sets protective HTTP headers

// CORS configuration - Allow access from frontend development server (Vite uses 5173, CRA uses 3000)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple welcome route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure File Sharing API is healthy and operational.',
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/logs', logRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Requested API endpoint not found',
  });
});

// Global Error Handling Middleware (Security best practice: do not leak detailed stack traces to users)
app.use((err, req, res, next) => {
  console.error('Server error details:', err.stack || err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size limit exceeded. Max file size is 10MB.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error. Please contact support.',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
