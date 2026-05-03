export const handleChatQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    const lowerMessage = message.toLowerCase();
    
    // Mock NLP Parsing
    let extractedData = {};
    
    if (lowerMessage.includes('hurry') || lowerMessage.includes('fast') || lowerMessage.includes('quick')) {
      extractedData.preference = 'fastest';
    } else if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('save')) {
      extractedData.preference = 'cheapest';
    }

    if (lowerMessage.includes('delhi')) {
      extractedData.destination = 'NIT Delhi';
    } else if (lowerMessage.includes('mumbai')) {
      extractedData.destination = 'Mumbai';
    }

    if (lowerMessage.includes('jalandhar')) {
      extractedData.source = 'NIT Jalandhar';
    }

    const reply = `I've analyzed your request. I can help you plan a trip${extractedData.destination ? ` to ${extractedData.destination}` : ''}. I've updated the planner form for you.`;

    return res.status(200).json({
      reply,
      extractedData
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ reply: 'Sorry, I am having trouble understanding you right now.' });
  }
};
