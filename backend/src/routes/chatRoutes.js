// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const uploadMiddleware=require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

router.post(
  '/pdf_upload',
  authMiddleware,
  uploadMiddleware, // multer middleware
  chatController.uploadPdf
);

module.exports = router;
