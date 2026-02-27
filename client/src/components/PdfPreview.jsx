function PdfPreview({ pdfUrl }) {
    const handleDownload = () => {
        // Download directly from server — this guarantees correct filename
        // The server sets Content-Disposition: attachment; filename="loan-application.pdf"
        window.open('/api/generate-pdf/download', '_blank');
    };

    return (
        <div className="dashboard-card pdf-preview">
            <div className="card-header">
                <h3>FORM PREVIEW</h3>
                {pdfUrl && (
                    <button onClick={handleDownload} className="download-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                    </button>
                )}
            </div>
            <div className="card-content pdf-content">
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        title="PDF Preview"
                        className="pdf-iframe"
                    />
                ) : (
                    <div className="pdf-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <p>Complete the fields and click "Generate Final Form" to see the preview</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PdfPreview;
