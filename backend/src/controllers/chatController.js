const prisma = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');

// ------------------ Upload PDFs ------------------
exports.uploadPdf = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Create a new chat entry
    const chat = await prisma.chat.create({
      data: { userId },
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

    // 3. Forward PDFs to FastAPI (optional, if you still need processing)
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
      process.env.FAST_API_URL+'/upload-pdfs',
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
    // Read from query
    const { chatId, persona } = req.query;

    if (!chatId || !persona) {
      return res.status(400).json({ error: 'chatId and persona are required' });
    }

    // 1. Send request to FastAPI with persona and chatId
    const fastApiSearchResponse = await axios.get(
      process.env.FAST_API_URL+'/search-chat',
      {
        params: { chat_id: chatId, query: persona },
      }
    );

    const searchResults = fastApiSearchResponse.data;

    // 2. Format results
    const formattedResults = searchResults.map((text, idx) => ({
      id: idx + 1,
      text: text.replace(/\n+/g, "\n").trim(),
    }));

    // 3. Merge all insights into a single text block
    const mergedText = formattedResults.map(r => r.text).join("\n\n");

    console.log("Formatted search results:", formattedResults);

    // 4. Save the insights to the chat in DB
    await prisma.chat.update({
      where: { chatId: Number(chatId) },
      data: { insights: mergedText },
    });

    return res.status(200).json({
      chatId,
      persona,
      searchResults: formattedResults,
      mergedText,
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
      // Return 200 with empty chats array
      return res.status(200).json({ chats: [], message: 'No chat history found.' });
    }
    return res.status(200).json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// ------------------ Delete Chat ------------------
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    // 1. Get PDFs associated with this chat
    const pdfs = await prisma.pdf.findMany({
      where: { chatId: Number(chatId) },
    });

    // 2. Delete local PDF files (if you are saving them in filesystem with fileName)
    for (const pdf of pdfs) {
      if (pdf.fileName) {
        const filePath = path.join(__dirname, '../uploads', pdf.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted local file: ${filePath}`);
        }
      }
    }

    // 3. Delete from Postgres (cascade removes PDFs too)
    await prisma.chat.delete({
      where: { chatId: Number(chatId) },
    });

    // 4. Call FastAPI to delete from Pinecone
    await axios.delete(process.env.FAST_API_URL+'/delete-chat', {
      params: { chat_id: chatId },
    });

    return res.status(200).json({
      message: `Chat ${chatId} deleted from Postgres, Pinecone, and local storage.`,
    });

  } catch (error) {
    console.error("Error in deleteChat:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
