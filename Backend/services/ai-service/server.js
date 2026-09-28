const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AI Service running" });
});

app.post("/api/ai/symptom-check", async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;

    if (!symptoms || !String(symptoms).trim()) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    // Temporary mock response.
    // Replace this block later with the real Gemini API call.
    return res.json({
      success: true,
      input: { symptoms, age, gender },
      result: {
        summary: "Possible general illness patterns detected from the provided symptoms.",
        recommendedSpecialty: "General Physician",
        precautions: [
          "Stay hydrated",
          "Monitor symptoms",
          "Consult a doctor if symptoms worsen"
        ]
      }
    });
  } catch (error) {
    console.error("AI service error:", error.message);
    return res.status(500).json({ message: "AI service failed" });
  }
});

const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});