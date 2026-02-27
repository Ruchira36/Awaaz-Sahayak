const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { REQUIRED_FIELDS } = require('../config/formSchema');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            // Mock response for demo
            return res.json({
                extractedFields: {
                    applicant_name: 'Demo User',
                    address: '123, Demo Village, Demo District, Demo State - 400001',
                    id_number: '1234 5678 9012'
                },
                rawText: '[Demo mode] Document text extraction simulated.',
                confidence: 'medium'
            });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are analyzing an Indian identity document or address proof image. 
Extract the following information if visible:
- Full name of the person
- Address (village, tehsil, district, state, PIN code)
- ID number (Aadhaar number, Voter ID, PAN, etc.)
- Date of birth
- Gender
- Father's or spouse's name

RESPOND IN THIS EXACT JSON FORMAT:
{
  "extracted_fields": {
    "applicant_name": "name if found or empty string",
    "father_or_spouse_name": "name if found or empty string",
    "date_of_birth": "DOB if found or empty string",
    "gender": "gender if found or empty string",
    "address": "full address if found or empty string",
    "id_number": "ID number if found or empty string"
  },
  "raw_text": "all readable text from the image",
  "confidence": "high/medium/low"
}

Only include fields you can clearly read. Do not guess.`;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: imageBase64
                }
            }
        ]);

        const responseText = result.response.text();
        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse vision response');
            }
        }

        // Filter out empty extracted fields
        const cleanFields = {};
        if (parsed.extracted_fields) {
            Object.entries(parsed.extracted_fields).forEach(([key, val]) => {
                if (val && String(val).trim() && key in REQUIRED_FIELDS) {
                    cleanFields[key] = String(val).trim();
                }
            });
        }

        res.json({
            extractedFields: cleanFields,
            rawText: parsed.raw_text || '',
            confidence: parsed.confidence || 'medium'
        });

    } catch (error) {
        console.error('Document extraction error:', error);
        res.status(500).json({
            error: 'Document extraction failed',
            message: error.message
        });
    }
});

module.exports = router;
