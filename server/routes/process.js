const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { REQUIRED_FIELDS, SYSTEM_PROMPT } = require('../config/formSchema');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    try {
        const { transcript, currentState } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        // Build context message
        const currentStateStr = JSON.stringify(currentState || {}, null, 2);
        const userMessage = `Current form state:\n${currentStateStr}\n\nNew user transcript: "${transcript}"\n\nExtract any new fields and generate the next follow-up question.`;

        // Check if API key exists
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            // Mock response for demo without API key
            return res.json(getMockResponse(transcript, currentState));
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.3,
            }
        });

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'You are Awaaz Sahayak. Follow these instructions exactly.' }] },
                { role: 'model', parts: [{ text: 'I understand. I am Awaaz Sahayak, ready to help.' }] }
            ]
        });

        const result = await chat.sendMessage(SYSTEM_PROMPT + '\n\n' + userMessage);
        const responseText = result.response.text();

        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch (parseErr) {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse LLM response as JSON');
            }
        }

        // Merge extracted fields into current state (non-destructive)
        const updatedState = { ...(currentState || {}) };
        if (parsed.extracted_fields) {
            Object.entries(parsed.extracted_fields).forEach(([key, value]) => {
                if (value && String(value).trim()) {
                    updatedState[key] = String(value).trim();
                }
            });
        }

        // Calculate filled and missing fields
        const filledFields = Object.keys(REQUIRED_FIELDS).filter(
            k => updatedState[k] && String(updatedState[k]).trim()
        );
        const missingFields = Object.keys(REQUIRED_FIELDS).filter(
            k => !updatedState[k] || !String(updatedState[k]).trim()
        );

        res.json({
            updatedState,
            nextQuestion: parsed.next_question || 'Kripya aage bataiye.',
            filledFields,
            missingFields,
            extractedThisRound: parsed.extracted_fields || {}
        });

    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({
            error: 'Processing failed',
            message: error.message,
            // Return current state unchanged on error
            updatedState: req.body.currentState || {},
            nextQuestion: 'Maaf kijiye, ek chhoti si gadbad ho gayi. Kripya dobara bataiye.',
            filledFields: [],
            missingFields: Object.keys(REQUIRED_FIELDS)
        });
    }
});

// Mock response for demo when no API key
function getMockResponse(transcript, currentState) {
    const state = { ...(currentState || {}) };
    const lower = transcript.toLowerCase().trim();
    const extracted = {};

    // Determine which field is currently being asked (first missing field)
    const currentMissing = Object.keys(REQUIRED_FIELDS).filter(k => !state[k] || !String(state[k]).trim());
    const currentlyAsking = currentMissing[0] || null;

    // Clean digits from transcript (strip spaces/dashes between numbers)
    const digitsOnly = transcript.replace(/[^\d]/g, '');

    // Helper: parse Hindi amount words like "2 lakh", "50 hazar", "1 crore"
    function parseHindiAmount(text) {
        const t = text.toLowerCase();
        // Match patterns like "2 lakh", "50 hazar", "1.5 crore", "5 sau"
        const patterns = [
            { regex: /(\d+(?:\.\d+)?)\s*(?:crore|karod|caror)/i, multiplier: 10000000 },
            { regex: /(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs)/i, multiplier: 100000 },
            { regex: /(\d+(?:\.\d+)?)\s*(?:hazar|hazaar|hajar|hajaar|hzar|thousand)/i, multiplier: 1000 },
            { regex: /(\d+(?:\.\d+)?)\s*(?:sau|hundred)/i, multiplier: 100 },
        ];
        let total = 0;
        let found = false;
        for (const { regex, multiplier } of patterns) {
            const m = t.match(regex);
            if (m) {
                total += parseFloat(m[1]) * multiplier;
                found = true;
            }
        }
        return found ? Math.round(total) : null;
    }

    // --- Try keyword-based extraction first, then fall back to context ---

    let matched = false;

    // --- Name extraction ---
    if (!state.applicant_name) {
        const namePatterns = [
            /(?:mera|meri|apna|hamara)\s+(?:naam|name)\s+(.+?)\s+(?:hai|he|h)\b/i,
            /(?:naam|name)\s+(?:hai|he|h|:)?\s*(.+)/i,
            /(?:i am|i'm|main hoon|main)\s+(.+)/i,
            /(?:my name is)\s+(.+)/i
        ];
        for (const pat of namePatterns) {
            const m = transcript.match(pat);
            if (m && m[1] && m[1].trim().length > 1) {
                state.applicant_name = m[1].trim().replace(/[.!?,]+$/, '').replace(/\s+(hai|he|h)$/i, '');
                extracted.applicant_name = state.applicant_name;
                matched = true;
                break;
            }
        }
        // Context: if we're asking for name and user typed something that looks like a name
        if (!matched && currentlyAsking === 'applicant_name') {
            const clean = transcript.trim().replace(/[.!?,]+$/, '');
            if (clean.length > 1 && !/^\d+$/.test(clean)) {
                state.applicant_name = clean;
                extracted.applicant_name = clean;
                matched = true;
            }
        }
    }

    // --- Father/Spouse name ---
    if (!state.father_or_spouse_name) {
        const fatherPatterns = [
            /(?:pita|father|papa|pitaji|baap)\s*(?:ka|ke|ki)?\s*(?:naam|name)?\s*(?:hai|he|h|:)?\s*(.+)/i,
            /(?:pati|husband|spouse)\s*(?:ka|ke|ki)?\s*(?:naam|name)?\s*(?:hai|he|h|:)?\s*(.+)/i
        ];
        for (const pat of fatherPatterns) {
            const m = transcript.match(pat);
            if (m && m[1] && m[1].trim().length > 1) {
                state.father_or_spouse_name = m[1].trim().replace(/[.!?,]+$/, '').replace(/\s+(hai|he|h)$/i, '');
                extracted.father_or_spouse_name = state.father_or_spouse_name;
                matched = true;
                break;
            }
        }
        // Context: if asking for father name and input looks like a name
        if (!matched && currentlyAsking === 'father_or_spouse_name') {
            const clean = transcript.trim().replace(/[.!?,]+$/, '').replace(/\s+(hai|he|h)$/i, '');
            if (clean.length > 1 && !/^\d+$/.test(clean)) {
                state.father_or_spouse_name = clean;
                extracted.father_or_spouse_name = clean;
                matched = true;
            }
        }
    }

    // --- Gender ---
    if (!state.gender) {
        if (/\b(mahila|female|woman|aurat|stri|lady|ladki)\b/i.test(lower)) {
            state.gender = 'Female';
            extracted.gender = 'Female';
            matched = true;
        } else if (/\b(purush|male|man|aadmi|ladka)\b/i.test(lower)) {
            state.gender = 'Male';
            extracted.gender = 'Male';
            matched = true;
        }
        // Context fallback
        if (!matched && currentlyAsking === 'gender') {
            const clean = transcript.trim().toLowerCase();
            if (/f|fem|mahila|aurat|stri|woman|lady/i.test(clean)) {
                state.gender = 'Female';
                extracted.gender = 'Female';
                matched = true;
            } else if (/m|mal|purush|aadmi|man/i.test(clean)) {
                state.gender = 'Male';
                extracted.gender = 'Male';
                matched = true;
            }
        }
    }

    // --- Date of birth ---
    if (!state.date_of_birth) {
        const dobMatch = transcript.match(/(\d{1,2})[\s/\-.]+(\d{1,2})[\s/\-.]+(\d{2,4})/);
        if (dobMatch) {
            state.date_of_birth = `${dobMatch[1]}/${dobMatch[2]}/${dobMatch[3]}`;
            extracted.date_of_birth = state.date_of_birth;
            matched = true;
        }
        const ageMatch = lower.match(/(\d+)\s*(?:saal|sal|year|years|age|umar)/);
        if (!state.date_of_birth && ageMatch) {
            const age = parseInt(ageMatch[1]);
            if (age > 0 && age < 120) {
                const birthYear = new Date().getFullYear() - age;
                state.date_of_birth = `01/01/${birthYear}`;
                extracted.date_of_birth = state.date_of_birth;
                matched = true;
            }
        }
        // Context: if asking for DOB and user types just a number (age)
        if (!matched && currentlyAsking === 'date_of_birth' && digitsOnly.length >= 1 && digitsOnly.length <= 3) {
            const age = parseInt(digitsOnly);
            if (age > 0 && age < 120) {
                const birthYear = new Date().getFullYear() - age;
                state.date_of_birth = `01/01/${birthYear}`;
                extracted.date_of_birth = state.date_of_birth;
                matched = true;
            }
        }
        // Context: if asking for DOB and user types a date string (must contain numbers)
        if (!matched && currentlyAsking === 'date_of_birth') {
            const clean = transcript.trim();
            // ensure it doesn't match the TTS success message
            if (clean.length > 3 && /\d/.test(clean) && !clean.toLowerCase().includes('taiyaar')) {
                state.date_of_birth = clean;
                extracted.date_of_birth = clean;
                matched = true;
            }
        }
    }

    // --- Annual income ---
    if (!state.annual_income) {
        // Try Hindi amount words first (lakh, hazar, crore)
        const hindiIncome = parseHindiAmount(lower);
        if (hindiIncome) {
            if (/din|daily|roz|per day/i.test(lower)) {
                state.annual_income = `Rs. ${hindiIncome * 365} (Rs. ${hindiIncome}/day)`;
            } else if (/month|mahina|monthly/i.test(lower)) {
                state.annual_income = `Rs. ${hindiIncome * 12} (Rs. ${hindiIncome}/month)`;
            } else {
                state.annual_income = `Rs. ${hindiIncome}`;
            }
            extracted.annual_income = state.annual_income;
            matched = true;
        }
        // Then try regular digit patterns
        if (!matched) {
            const incomeMatch = lower.match(/(\d+)\s*(?:rupay|rupee|rs|inr)?[,\s]*(?:per day|per month|monthly|daily|mahina|din|roz)/i)
                || lower.match(/(?:income|kamai|kamat|aay|earn|milta|milte|milti|salary|tankhwah).*?(\d+)/i)
                || lower.match(/(\d+).*?(?:income|kamai|kamat|aay|earn|milta|milte|milti|salary|tankhwah)/i);
            if (incomeMatch) {
                const amount = parseInt(incomeMatch[1]);
                if (/din|daily|roz|per day/i.test(lower)) {
                    state.annual_income = `Rs. ${amount * 365} (Rs. ${amount}/day)`;
                } else if (/month|mahina|monthly/i.test(lower)) {
                    state.annual_income = `Rs. ${amount * 12} (Rs. ${amount}/month)`;
                } else {
                    state.annual_income = `Rs. ${amount}`;
                }
                extracted.annual_income = state.annual_income;
                matched = true;
            }
        }
        // Context: if asking for income and user types a number or Hindi amount
        if (!matched && currentlyAsking === 'annual_income') {
            const ctxAmount = parseHindiAmount(lower);
            if (ctxAmount) {
                state.annual_income = `Rs. ${ctxAmount}`;
                extracted.annual_income = state.annual_income;
                matched = true;
            } else if (digitsOnly.length >= 2) {
                const amount = parseInt(digitsOnly);
                if (amount > 0) {
                    state.annual_income = `Rs. ${amount}`;
                    extracted.annual_income = state.annual_income;
                    matched = true;
                }
            }
        }
    }

    // --- Loan amount ---
    if (!state.loan_amount) {
        // Try Hindi amount words first (lakh, hazar, crore)
        const hindiLoan = parseHindiAmount(lower);
        if (hindiLoan && /loan|paisa|chahiye|amount|rashi|dena|dedo|dijiye|udhar/i.test(lower)) {
            state.loan_amount = `Rs. ${hindiLoan}`;
            extracted.loan_amount = state.loan_amount;
            matched = true;
        }
        // Then try regular digit patterns
        if (!matched) {
            const loanMatch = lower.match(/(?:loan|paisa|chahiye|amount|rashi|dena|dedo|dijiye|udhar)\s*(?:ke liye|ka)?\s*(?:rs\.?|rupay|rupee)?\s*(\d+)/i)
                || lower.match(/(\d+)\s*(?:rupay|rupee|rs)?\s*(?:loan|chahiye|dedo|dijiye|udhar|dena)/i);
            if (loanMatch) {
                state.loan_amount = `Rs. ${parseInt(loanMatch[1])}`;
                extracted.loan_amount = state.loan_amount;
                matched = true;
            }
        }
        // Context: if asking for loan amount and user types Hindi amount or number
        if (!matched && currentlyAsking === 'loan_amount') {
            const ctxAmount = parseHindiAmount(lower);
            if (ctxAmount) {
                state.loan_amount = `Rs. ${ctxAmount}`;
                extracted.loan_amount = state.loan_amount;
                matched = true;
            } else if (digitsOnly.length >= 2) {
                const amount = parseInt(digitsOnly);
                if (amount > 0) {
                    state.loan_amount = `Rs. ${amount}`;
                    extracted.loan_amount = state.loan_amount;
                    matched = true;
                }
            }
        }
    }

    // --- Loan purpose ---
    if (!state.loan_purpose) {
        // Common keywords
        if (/\b(seeds|beej|kheti|farming|agriculture|kisan|crop|fasal)\b/i.test(lower)) {
            state.loan_purpose = 'Agriculture / Farming';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        } else if (/\b(dukaan|shop|store|inventory|saman|business|vyapar|karobar)\b/i.test(lower)) {
            state.loan_purpose = 'Business / Shop';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        } else if (/\b(ghar|house|home|construction|repair|makaan|building)\b/i.test(lower)) {
            state.loan_purpose = 'Home Construction / Repair';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        } else if (/\b(school|padhai|education|study|college|fees|vidyalaya)\b/i.test(lower)) {
            state.loan_purpose = 'Education';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        } else if (/\b(medical|hospital|doctor|ilaj|dawai|treatment|health)\b/i.test(lower)) {
            state.loan_purpose = 'Medical / Health';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        } else if (/\b(shaadi|wedding|marriage|vivah)\b/i.test(lower)) {
            state.loan_purpose = 'Wedding / Marriage';
            extracted.loan_purpose = state.loan_purpose;
            matched = true;
        }
        // Context: if asking for purpose and user gives free text
        if (!matched && currentlyAsking === 'loan_purpose') {
            const clean = transcript.trim();
            if (clean.length > 1 && !/^\d+$/.test(clean)) {
                state.loan_purpose = clean;
                extracted.loan_purpose = clean;
                matched = true;
            }
        }
    }

    // --- Address ---
    if (!state.address) {
        const addrPatterns = [
            /(?:address|pata|rehte|rahte|gaon|village)\s*(?:hai|he|h|:)?\s*(.+)/i,
            /(?:main|hum|me)\s+(.+?)\s+(?:mein|me|se)\s+(?:rehte|rahte|hai)/i
        ];
        for (const pat of addrPatterns) {
            const m = transcript.match(pat);
            if (m && m[1] && m[1].trim().length > 3) {
                state.address = m[1].trim();
                extracted.address = state.address;
                matched = true;
                break;
            }
        }
        // Context: if asking for address and user gives free text
        if (!matched && currentlyAsking === 'address') {
            const clean = transcript.trim();
            if (clean.length > 3) {
                state.address = clean;
                extracted.address = clean;
                matched = true;
            }
        }
    }

    // --- ID number ---
    if (!state.id_number) {
        // Aadhaar: 12 digits (possibly with spaces/dashes)
        const aadhaarMatch = transcript.match(/(\d{4}[\s-]?\d{4}[\s-]?\d{4})/);
        if (aadhaarMatch) {
            state.id_number = aadhaarMatch[1];
            extracted.id_number = state.id_number;
            matched = true;
        }
        // Voter ID: 3 letters + 7 digits
        const voterMatch = transcript.match(/([A-Z]{3}\d{7})/i);
        if (!state.id_number && voterMatch) {
            state.id_number = voterMatch[1].toUpperCase();
            extracted.id_number = state.id_number;
            matched = true;
        }
        // Context: if asking for ID and user types any long number or ID-like string
        if (!matched && currentlyAsking === 'id_number') {
            const clean = transcript.trim();
            if (clean.length >= 4) {
                state.id_number = clean;
                extracted.id_number = clean;
                matched = true;
            }
        }
    }

    // --- Phone number ---
    if (!state.phone_number) {
        const phoneMatch = transcript.match(/(?<!\d)(\d{10})(?!\d)/) || transcript.match(/(?<!\d)(\d{5}[\s-]\d{5})(?!\d)/);
        if (phoneMatch) {
            state.phone_number = phoneMatch[1].replace(/[\s-]/g, '');
            extracted.phone_number = state.phone_number;
            matched = true;
        }
        // Context: if asking for phone and user types digits
        if (!matched && currentlyAsking === 'phone_number') {
            if (digitsOnly.length >= 7) {
                state.phone_number = digitsOnly;
                extracted.phone_number = digitsOnly;
                matched = true;
            }
        }
    }

    const filledFields = Object.keys(REQUIRED_FIELDS).filter(k => state[k] && String(state[k]).trim());
    const missingFields = Object.keys(REQUIRED_FIELDS).filter(k => !state[k] || !String(state[k]).trim());

    const nextField = missingFields[0];
    let nextQ;
    if (Object.keys(extracted).length > 0) {
        nextQ = nextField
            ? `Dhanyavaad! Maine samajh liya. Ab kripya bataiye: ${REQUIRED_FIELDS[nextField].hindi}`
            : 'Bahut accha! Sab jaankari mil gayi hai. Ab aap "Generate Final Form" button dabayein.';
    } else {
        nextQ = nextField
            ? REQUIRED_FIELDS[nextField].hindi
            : 'Sab jaankari mil gayi hai! Ab aap form bana sakte hain.';
    }

    return {
        updatedState: state,
        nextQuestion: nextQ,
        filledFields,
        missingFields,
        extractedThisRound: extracted
    };
}

module.exports = router;
