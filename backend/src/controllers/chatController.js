const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');

// ------------------ Upload PDFs ------------------
exports.uploadPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { persona, job } = req.body;

    // 1. Create a new chat entry
    const chat = await prisma.chat.create({
      data: { userId, persona: persona || null, job: job || null },
    });

    console.log(`Received ${req.files?.length || 0} files for chat ID ${chat.chatId}`);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files uploaded' });
    }

    // 2. Save PDFs in Postgres
    const pdfData = req.files.map(file => ({
      pdf: file.buffer,
      chatId: chat.chatId,
    }));
    await prisma.pdf.createMany({ data: pdfData });

    // 3. Forward PDFs to FastAPI
    const formData = new FormData();
    formData.append('chat_id', String(chat.chatId));

    req.files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size,
      });
    });

    const fastApiResponse = await axios.post(
      'http://localhost:8000/upload-pdfs',
      formData,
      { headers: formData.getHeaders() }
    );


    return res.status(201).json({
      message: 'Chat created and PDFs uploaded successfully',
      chatId: chat.chatId,
      fastApiResponse: fastApiResponse.data,
    });

  } catch (error) {
    console.error("Error in uploadPdf:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// ------------------ Search Chat ------------------
exports.searchChat = async (req, res) => {
  try {
    const { chatId, query, scoreThreshold } = req.query;

    if (!chatId || !query) {
      return res.status(400).json({ error: 'chatId and query are required' });
    }

    const fastApiSearchResponse = await axios.get(
      'http://localhost:8000/search-chat',
      {
        params: {
          query,
          chat_id: chatId,
          score_threshold: scoreThreshold || 0.5,
        },
      }
    );

    // Now directly get the array of texts
    const searchResults = fastApiSearchResponse.data?.results || [];

    console.log("Search results from FastAPI:", searchResults);

    return res.status(200).json({
      chatId,
      query,
      searchResults,
    });

  } catch (error) {
    console.error("Error in searchChat:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// ------------------ Get Chats by User ------------------
exports.getChatsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await prisma.chat.findMany({
      where: { userId },
      include: { pdfs: true },
    });

    if (!chats || chats.length === 0) {
      return res.status(404).json({ error: 'No chats found for this user' });
    }

    return res.status(200).json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
