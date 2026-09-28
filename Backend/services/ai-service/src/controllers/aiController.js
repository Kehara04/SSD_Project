const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API Client
let aiClient;
try {
  aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
  console.error('Failed to initialize GoogleGenerativeAI. Is GEMINI_API_KEY set?', error);
}

// @desc    Analyze symptoms using Gemini AI
// @route   POST /api/ai/symptoms
// @access  Public
const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({ message: 'Invalid symptoms format. Please provide a string.' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return res.status(503).json({
        message: 'AI service is currently unavailable.',
        error: 'Server missing valid Gemini API Key.',
      });
    }

    const prompt = `You are a medical AI assistant. The user has reported the following input: "${symptoms}".
Please analyze this input.

IMPORTANT RULE:
If the input DOES NOT seem like a medical symptom or health condition (e.g., general questions, greetings, random text), you MUST return EXACTLY this message in the "suggestions" field: "That doesn't seem like a medical symptom. Describe your symptoms, including severity, duration, and any changes over time. (e.g. I have had a mild headache and dry cough for 3 days)." and leave "specialty" and "disclaimer" as empty strings.

Otherwise, if it IS a reasonable medical symptom, provide:
1. Preliminary health suggestions (What might be the general cause or immediate home-care tips).
2. A recommended doctor specialty for consultation (e.g., General Medicine, Neurology, Cardiology).
3. A strict disclaimer that this is NOT professional medical advice.

Format the output strictly as a JSON object with exactly three string keys: "suggestions", "specialty", and "disclaimer".`;

    const modelObj = aiClient.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await modelObj.generateContent(prompt);
    const responseObj = await result.response;
    let resultText = responseObj.text();

    // Clean up potential markdown formatting if JSON Mime Type fails fallback
    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const jsonResult = JSON.parse(resultText);

    return res.status(200).json(jsonResult);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({
      message: 'An error occurred while processing the symptoms.',
      error: error.message || error.toString(),
    });
  }
};

module.exports = { analyzeSymptoms };
