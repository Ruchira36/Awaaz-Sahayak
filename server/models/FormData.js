const mongoose = require('mongoose');

const formDataSchema = new mongoose.Schema({
    formData: {
        applicant_name: { type: String, default: '' },
        father_or_spouse_name: { type: String, default: '' },
        date_of_birth: { type: String, default: '' },
        gender: { type: String, default: '' },
        annual_income: { type: String, default: '' },
        loan_amount: { type: String, default: '' },
        loan_purpose: { type: String, default: '' },
        address: { type: String, default: '' },
        id_number: { type: String, default: '' },
        phone_number: { type: String, default: '' }
    },
    transcripts: [{
        text: String,
        timestamp: { type: Date, default: Date.now }
    }],
    chatHistory: [{
        role: { type: String, enum: ['user', 'assistant'] },
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'pdf_generated'],
        default: 'in_progress'
    },
    pdfGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('FormData', formDataSchema);
