const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Your frontend URL
  credentials: true,                // If you want to send cookies/auth headers
}));

// API routes
app.use('/auth', authRoutes);
app.use('/user', require('./routes/userRoutes'));

// Error middleware
app.use(errorHandler);

module.exports = app;