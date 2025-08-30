const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require("./config/passport"); // ensures strategy registers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Your frontend URL
  credentials: true,                // If you want to send cookies/auth headers
}));
// Passport without sessions
app.use(passport.initialize());

app.use("/auth", authRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", detail: err.message });
});

// API routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
// Error middleware
app.use(errorHandler);

module.exports = app;