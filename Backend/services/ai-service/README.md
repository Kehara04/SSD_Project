# AI Service (Symptom Checker)

## Overview

The AI Service provides a symptom-checking feature for the Smart Healthcare Platform. It allows users to input symptoms and receive preliminary health suggestions along with recommended doctor specialties.

This service is implemented as a separate microservice and integrates with the Gemini API to generate AI-based responses.

---

## Features

* Accepts user symptom input via API
* Validates input data
* Generates AI-based health suggestions
* Recommends suitable doctor specialties
* Returns structured response with disclaimer
* Easily integrates with frontend applications

---

## Technologies Used

* Node.js
* Express.js
* Gemini API
* REST API architecture

---

## API Endpoint

### Analyze Symptoms

**POST /api/ai/symptoms**

### Request Body

```json
{
  "symptoms": "fever, headache, cough"
}
```

### Response

```json
{
  "success": true,
  "suggestion": "Possible viral infection...",
  "recommendedSpecialty": "General Physician",
  "disclaimer": "This is not a medical diagnosis. Please consult a qualified doctor."
}
```

---

## How It Works

1. User enters symptoms through the frontend
2. Frontend sends request to AI Service
3. AI Service validates the input
4. AI Service sends request to Gemini API
5. Gemini API processes the input and returns response
6. AI Service formats the response
7. Response is sent back to the frontend

---

## Environment Variables

Create a `.env` file inside the AI service folder:

```
PORT=500X
GEMINI_API_KEY=your_api_key_here
```

---

## Running the Service

### Install Dependencies

```
npm install
```

### Start the Service

```
npm start
```

---

## Security Considerations

* API keys are stored using environment variables
* Input validation is performed before processing
* Service follows stateless REST communication
* Should be protected using JWT authentication in production

---

## Notes

* This service provides **preliminary health suggestions only**
* It does **not replace professional medical advice**
* Always consult a qualified doctor for accurate diagnosis

---
