const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout',authController.logout);
// API End points
// /auth/signup - User signup
// /auth/login - User login
// /auth/logout - User logout - deletes the jwt token from the cookie 
// /auth/google - Google OAuth authentication  

module.exports = router;
