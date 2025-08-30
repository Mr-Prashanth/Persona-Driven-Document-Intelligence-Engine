const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Upload PDFs and create chat
router.post(
  '/pdf_upload',
  authMiddleware,
  uploadMiddleware,
  chatController.uploadPdf
);

// Search within a chat
router.get('/search', authMiddleware, chatController.searchChat);

// Get user’s chat history
router.get('/chats_history', authMiddleware, chatController.getChatsByUser);

// Delete chat by ID
router.delete('/delete/:chatId', authMiddleware, chatController.deleteChat);
router.post("/new-chat",authMiddleware,chatController.startNewChat);

module.exports = router;
