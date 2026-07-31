const express = require('express');
const router = express.Router();

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are FarmBot 🌿, a friendly and knowledgeable AI assistant for FreshFarm Marketplace — a platform that connects local farmers directly with consumers for fresh, high-quality produce.

Your role is to help users with:
1. **Product & Shopping**: Browsing products, understanding categories (vegetables, fruits, grains, dairy), adding items to cart, placing orders.
2. **Orders & Delivery**: Checking order status, understanding delivery timelines, returning or cancelling orders via "My Orders".
3. **Accounts**: Registering as a buyer or farmer, logging in, password resets.
4. **For Farmers**: Listing products, managing inventory via the Farmer Dashboard, uploading product images.
5. **For Admins**: Managing users, overseeing platform operations via the Admin Dashboard.
6. **General Farming Knowledge**: Seasonal produce tips, storage advice, freshness indicators, farm-to-table benefits.

Platform Facts:
- Users can register as "buyer" or "farmer"
- Farmers can list products with name, description, price, stock quantity, and images
- Buyers can add products to cart, checkout, and track orders
- The marketplace supports fresh produce including vegetables, fruits, dairy, and grains
- All products are sourced directly from local farmers

Tone Guidelines:
- Be warm, friendly, and helpful — like a knowledgeable friend at a farmers' market
- Use farming emojis sparingly (🌿, 🥕, 🌾, 🍅) to feel approachable
- Keep answers concise but complete
- If you can't answer something specific, guide users to the Contact section or suggest they email support

DO NOT:
- Make up order details or prices (you don't have access to live data)
- Discuss topics completely unrelated to farming, food, or the platform
- Give medical advice about food allergies — always recommend consulting a professional`;

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured. Please add GEMINI_API_KEY to backend .env'
      });
    }

    // Build conversation history for Gemini
    const contents = [];

    // Add prior turns from history (max 10 turns for context)
    const recentHistory = history.slice(-10);
    for (const turn of recentHistory) {
      if (turn.role && turn.text) {
        contents.push({
          role: turn.role === 'bot' ? 'model' : 'user',
          parts: [{ text: turn.text }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.9,
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errData);
      return res.status(502).json({
        success: false,
        error: errData?.error?.message || 'Failed to get response from AI service'
      });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ success: false, error: 'Empty response from AI' });
    }

    res.json({ success: true, reply: reply.trim() });

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
