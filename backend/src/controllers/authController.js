// backend/controllers/authController.js
const prisma = require("../config/db");
const bcrypt = require("bcrypt");
const { signJwtToken } = require("../utils/jwt");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  maxAge: Number(process.env.JWT_COOKIE_MAX_AGE_MS || 60 * 60 * 1000),
};

// --------- EMAIL/PASSWORD SIGNUP ----------
exports.signup = async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with same email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, name, phoneNumber },
    });

    // 🔑 Create a first chat for this user
    const chat = await prisma.chat.create({
      data: { userId: user.userId },
    });

    const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user.userId, name: user.name, email: user.email },
      chatId: chat.chatId, // send to frontend so it can store in localStorage
    });
  } catch (err) {
    next(err);
  }
};

// --------- EMAIL/PASSWORD LOGIN ----------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password)
      return res.status(400).json({ error: "This account uses Google login only" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: "Invalid credentials" });

    // 🔑 Check if user has an active chat, else create one
   
      chat = await prisma.chat.create({ data: { userId: user.userId } });
    

    const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful",
      user: { id: user.userId, name: user.name, email: user.email },
      chatId: chat.chatId, // return chatId
    });
  } catch (err) {
    next(err);
  }
};

// --------- LOGOUT ----------
exports.logout = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(400).json({ message: "No token found" });

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
  });
  return res.json({ message: "Logged out successfully" });
};

// --------- GOOGLE: success handler ----------
exports.googleSuccess = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Google auth failed" });

  // 🔑 Ensure user has a chat
  // let chat = await prisma.chat.findFirst({
  //   where: { userId: user.userId },
  //   orderBy: { chatId: "desc" },
  // });
  // if (!chat) {
    chat = await prisma.chat.create({ data: { userId: user.userId } });
  // }

  const token = signJwtToken({ id: user.userId, name: user.name, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.status(200).json({
    message: "Google login successful",
    user: { id: user.userId, name: user.name, email: user.email },
    chatId: chat.chatId,
  });
};

// --------- GOOGLE: failure handler ----------
exports.googleFailure = async (_req, res) => {
  return res.status(400).json({ error: "Google login failed" });
};

// --------- GOOGLE: callback (redirect after OAuth) ----------
exports.googleCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
  }

  // 🔑 Ensure user has a chat
  let chat = await prisma.chat.findFirst({
    where: { userId: req.user.userId },
    orderBy: { chatId: "desc" },
  });
  if (!chat) {
    chat = await prisma.chat.create({ data: { userId: req.user.userId } });
  }

  const token = signJwtToken({
    id: req.user.userId,
    name: req.user.name,
    email: req.user.email,
  });

  res.cookie("token", token, COOKIE_OPTIONS);

  // ✅ Redirect to frontend with chatId + name in query
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-success?name=${encodeURIComponent(
      req.user.name
    )}&chatId=${chat.chatId}`
  );
};
