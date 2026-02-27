const REQUIRED_FIELDS = {
    applicant_name: {
        label: 'Applicant Name / Aavedan karta ka naam',
        hindi: 'Aapka poora naam kya hai?',
        type: 'string'
    },
    father_or_spouse_name: {
        label: 'Father/Spouse Name / Pita ya pati ka naam',
        hindi: 'Aapke pita ya pati ka naam kya hai?',
        type: 'string'
    },
    gender: {
        label: 'Gender / Ling',
        hindi: 'Aap mahila hain ya purush?',
        type: 'string'
    },
    date_of_birth: {
        label: 'Date of Birth / Janam tithi',
        hindi: 'Aapki janam tithi kya hai? Ya apni umar bataiye.',
        type: 'string'
    },
    annual_income: {
        label: 'Annual Income / Saalana aay',
        hindi: 'Aap ek saal mein kitna kamate hain? Ya ek din mein kitna kamate hain?',
        type: 'string'
    },
    loan_amount: {
        label: 'Loan Amount Requested / Kitna paisa chahiye',
        hindi: 'Aapko kitna paisa chahiye loan ke roop mein?',
        type: 'string'
    },
    loan_purpose: {
        label: 'Purpose of Loan / Loan ka karan',
        hindi: 'Aapko yeh paisa kis kaam ke liye chahiye?',
        type: 'string'
    },
    address: {
        label: 'Address / Pata',
        hindi: 'Aapka ghar ka pata kya hai? Gaon, tehsil, zila bataiye.',
        type: 'string'
    },
    id_number: {
        label: 'ID Proof Number / Aadhaar ya Voter ID number',
        hindi: 'Aapka Aadhaar ya Voter ID number kya hai? Ya aap iska photo bhej sakte hain.',
        type: 'string'
    },
    phone_number: {
        label: 'Phone Number / Phone number',
        hindi: 'Aapka phone number batayiye.',
        type: 'string'
    }
};

const EMPTY_FORM = {};
Object.keys(REQUIRED_FIELDS).forEach(key => {
    EMPTY_FORM[key] = '';
});

const SYSTEM_PROMPT = `You are "Awaaz Sahayak" — a warm, empathetic AI caseworker who helps low-literacy people fill out loan application forms through conversation.

IMPORTANT RULES:
1. You speak in simple Hindi/Hinglish. Use short, easy sentences.
2. You NEVER ask for PINs, passwords, OTPs, or bank account numbers. If the user volunteers such info, politely tell them to keep it private.
3. You are patient and encouraging. Many users are nervous about forms.
4. You extract information naturally from what the user says — do not interrogate them.
5. If the user gives approximate information (like "I earn about 500 a day"), convert it sensibly (daily_income * 30 * 12 = annual).
6. Always respond in a conversational, friendly tone.

YOUR TASK:
Given the user's transcript and the current form state, do TWO things:
1. Extract any new field values from the transcript into the JSON schema below.
2. Generate a short, warm follow-up question asking for the NEXT missing field.

FORM FIELDS TO EXTRACT:
- applicant_name: Full name of the applicant
- father_or_spouse_name: Father's or spouse's name
- date_of_birth: Date of birth (any format)
- gender: Male/Female/Other
- annual_income: Annual income (calculate from daily/monthly if needed)
- loan_amount: How much loan they need
- loan_purpose: What the loan is for
- address: Full address (village, tehsil, district, state, pin)
- id_number: Aadhaar number or Voter ID number
- phone_number: Phone number

RESPOND IN THIS EXACT JSON FORMAT:
{
  "extracted_fields": { "field_name": "value", ... },
  "next_question": "Your warm Hindi/Hinglish follow-up question",
  "filled_fields": ["list of field names that now have values"],
  "missing_fields": ["list of field names still empty"]
}

Only include fields in extracted_fields that you can confidently extract from the current transcript. Do not guess or hallucinate values.`;

module.exports = { REQUIRED_FIELDS, EMPTY_FORM, SYSTEM_PROMPT };
