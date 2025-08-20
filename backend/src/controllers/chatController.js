// controllers/chatController.js
const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data'); // npm install form-data

exports.uploadPdf = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    const { persona, job } = req.body;

    // Create a new chat
    const chat = await prisma.chat.create({
      data: {
        userId,
        persona: persona || null,
        job: job || null,
      },
    });

    console.log(`Received ${req.files?.length || 0} files for chat ID ${chat.chatId}`);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files uploaded' });
    }

    // Store PDFs in Postgres
    const pdfData = req.files.map(file => ({
      pdf: file.buffer,
      chatId: chat.chatId,
    }));

    await prisma.pdf.createMany({ data: pdfData });

    // Send PDFs to FastAPI
    const formData = new FormData();
    formData.append('chat_id', String(chat.chatId));

    req.files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size // optional but helps streaming
      });
    });

    const fastApiResponse = await axios.post(
      'http://localhost:8000/upload-pdfs',
      formData,
      { headers: formData.getHeaders() }
    );

    return res.status(201).json({
      message: 'Chat created and PDFs processed successfully',
      chatId: chat.chatId,
      fastApiResponse: fastApiResponse.data,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};

exports.getChatsByUser = async (req, res) => {
  try {
    const userId = req.user.id; // internal userId from JWT

    // fetch chats directly since userId is already stored in Chat table
    const chats = await prisma.chat.findMany({
      where: { userId: userId },
      include: {
        pdfs: true,  // includes PDFs for each chat
      },
    });

    if (!chats || chats.length === 0) {
      return res.status(404).json({ error: 'No chats found for this user' });
    }

    return res.status(200).json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};
