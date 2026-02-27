const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const FormData = require('../models/FormData');

// Store the last generated PDF in memory for download
let lastPdfBuffer = null;

// GET endpoint — serves the last generated PDF as a file download
router.get('/download', (req, res) => {
    if (!lastPdfBuffer) {
        return res.status(404).json({ error: 'No PDF generated yet. Please fill the form first.' });
    }
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="loan-application.pdf"',
        'Content-Length': lastPdfBuffer.length,
        'Cache-Control': 'no-cache'
    });
    res.send(lastPdfBuffer);
});

router.post('/', async (req, res) => {
    try {
        const { formData, sessionId } = req.body;

        if (!formData) {
            return res.status(400).json({ error: 'Form data is required' });
        }

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            info: {
                Title: 'Micro-Loan Application Form',
                Author: 'AwaazAgent',
            }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);

            // Cache the PDF for the GET /download endpoint
            lastPdfBuffer = pdfBuffer;

            // Save to MongoDB
            try {
                if (sessionId) {
                    await FormData.findByIdAndUpdate(sessionId, {
                        formData,
                        status: 'pdf_generated',
                        pdfGenerated: true
                    });
                } else {
                    await FormData.create({
                        formData,
                        status: 'pdf_generated',
                        pdfGenerated: true
                    });
                }
            } catch (dbErr) {
                console.warn('DB save warning:', dbErr.message);
            }

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="loan-application.pdf"',
                'Content-Length': pdfBuffer.length
            });
            res.send(pdfBuffer);
        });

        // === PDF LAYOUT ===
        const pageWidth = doc.page.width;
        const marginLeft = 40;
        const marginRight = 40;
        const contentWidth = pageWidth - marginLeft - marginRight;

        // --- Header ---
        doc.rect(marginLeft, 30, contentWidth, 80).lineWidth(2).stroke('#1a237e');
        doc.rect(marginLeft + 1, 31, contentWidth - 2, 78).fill('#e8eaf6');

        doc.fill('#1a237e').fontSize(18).font('Helvetica-Bold')
            .text('MICRO-LOAN APPLICATION FORM', marginLeft, 45, { width: contentWidth, align: 'center' });
        doc.fontSize(11).font('Helvetica')
            .text('National Micro-Finance Development Corporation', marginLeft, 68, { width: contentWidth, align: 'center' });
        doc.fontSize(9).fill('#424242')
            .text('Form No: NMFDC/ML/2026-27', marginLeft, 85, { width: contentWidth, align: 'center' });

        let y = 130;

        // --- Section: Personal Details ---
        y = drawSectionHeader(doc, 'SECTION A: PERSONAL DETAILS', marginLeft, y, contentWidth);
        y += 5;

        y = drawField(doc, '1. Full Name of Applicant', formData.applicant_name || '____________', marginLeft, y, contentWidth);
        y = drawField(doc, '2. Father / Spouse Name', formData.father_or_spouse_name || '____________', marginLeft, y, contentWidth);

        // DOB and Gender on same row
        const halfWidth = (contentWidth - 20) / 2;
        drawField(doc, '3. Date of Birth', formData.date_of_birth || '____________', marginLeft, y, halfWidth);
        y = drawField(doc, '4. Gender', formData.gender || '____________', marginLeft + halfWidth + 20, y, halfWidth);

        y += 5;

        // --- Section: Financial Details ---
        y = drawSectionHeader(doc, 'SECTION B: FINANCIAL DETAILS', marginLeft, y, contentWidth);
        y += 5;

        y = drawField(doc, '5. Annual Income (Rs.)', formData.annual_income || '____________', marginLeft, y, contentWidth);
        y = drawField(doc, '6. Loan Amount Requested (Rs.)', formData.loan_amount || '____________', marginLeft, y, contentWidth);
        y = drawField(doc, '7. Purpose of Loan', formData.loan_purpose || '____________', marginLeft, y, contentWidth);

        y += 5;

        // --- Section: Address & Identity ---
        y = drawSectionHeader(doc, 'SECTION C: ADDRESS & IDENTIFICATION', marginLeft, y, contentWidth);
        y += 5;

        y = drawField(doc, '8. Residential Address', formData.address || '____________', marginLeft, y, contentWidth, true);
        y = drawField(doc, '9. ID Proof Number (Aadhaar / Voter ID)', formData.id_number || '____________', marginLeft, y, contentWidth);
        y = drawField(doc, '10. Contact Phone Number', formData.phone_number || '____________', marginLeft, y, contentWidth);

        y += 15;

        // --- Declaration ---
        y = drawSectionHeader(doc, 'DECLARATION', marginLeft, y, contentWidth);
        y += 8;
        doc.fontSize(9).font('Helvetica').fill('#333333')
            .text(
                'I hereby declare that all the information provided above is true and correct to the best of my knowledge. ' +
                'I understand that any false information may lead to rejection of my application. ' +
                'I authorize the institution to verify the details provided.',
                marginLeft + 10, y, { width: contentWidth - 20, lineGap: 3 }
            );

        y += 60;

        // Signature boxes
        doc.fontSize(10).font('Helvetica');
        doc.text('Date: _______________', marginLeft + 10, y);
        doc.text('Signature / Thumb Impression: _______________', marginLeft + contentWidth / 2, y);

        y += 40;

        // --- Office Use Only ---
        doc.rect(marginLeft, y, contentWidth, 60).lineWidth(1).stroke('#9e9e9e');
        doc.fontSize(9).font('Helvetica-Bold').fill('#666666')
            .text('FOR OFFICE USE ONLY', marginLeft + 10, y + 8);
        doc.font('Helvetica').fontSize(8)
            .text('Application No: _________________    Received by: _________________    Date: _________________',
                marginLeft + 10, y + 28, { width: contentWidth - 20 });
        doc.text('Verification Status:  [ ] Approved   [ ] Rejected   [ ] Pending Review',
            marginLeft + 10, y + 42, { width: contentWidth - 20 });

        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'PDF generation failed', message: error.message });
    }
});

function drawSectionHeader(doc, text, x, y, width) {
    doc.rect(x, y, width, 24).fill('#1a237e');
    doc.fill('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(text, x + 10, y + 6, { width: width - 20 });
    return y + 30;
}

function drawField(doc, label, value, x, y, width, multiline = false) {
    const fieldHeight = multiline ? 50 : 32;

    // Field box
    doc.rect(x, y, width, fieldHeight).lineWidth(0.5).stroke('#bdbdbd');

    // Label
    doc.fontSize(8).font('Helvetica-Bold').fill('#616161')
        .text(label, x + 8, y + 4, { width: width - 16 });

    // Value
    doc.fontSize(11).font('Helvetica').fill('#000000')
        .text(value, x + 8, y + (multiline ? 18 : 16), { width: width - 16 });

    return y + fieldHeight + 4;
}

module.exports = router;
