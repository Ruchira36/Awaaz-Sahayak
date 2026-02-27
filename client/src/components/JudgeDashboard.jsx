import TranscriptPanel from './TranscriptPanel';
import FieldTracker from './FieldTracker';
import PdfPreview from './PdfPreview';

function JudgeDashboard({
    transcripts,
    liveTranscript,
    formState,
    filledFields,
    missingFields,
    fieldLabels,
    pdfUrl,
    pdfBlob,
    isProcessing
}) {
    return (
        <div className="judge-dashboard">
            <div className="dashboard-header">
                <h2>Dashboard</h2>
                <span className="dashboard-badge">Live</span>
            </div>
            <div className="dashboard-grid">
                <TranscriptPanel
                    transcripts={transcripts}
                    liveTranscript={liveTranscript}
                    isProcessing={isProcessing}
                />
                <FieldTracker
                    filledFields={filledFields}
                    missingFields={missingFields}
                    fieldLabels={fieldLabels}
                    formState={formState}
                />
                <PdfPreview pdfUrl={pdfUrl} pdfBlob={pdfBlob} />
            </div>
        </div>
    );
}

export default JudgeDashboard;
