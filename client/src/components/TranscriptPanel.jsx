function TranscriptPanel({ transcripts, liveTranscript, isProcessing }) {
    return (
        <div className="dashboard-card transcript-panel">
            <div className="card-header">
                <h3>Live Transcript</h3>
                {isProcessing && <span className="processing-badge">Processing</span>}
            </div>
            <div className="card-content">
                {transcripts.length === 0 && !liveTranscript ? (
                    <p className="placeholder-text">Waiting for voice input...</p>
                ) : (
                    <div className="transcript-list">
                        {transcripts.map((t, i) => (
                            <div key={i} className="transcript-entry">
                                <span className="transcript-time">{t.time}</span>
                                <span className="transcript-text">{t.text}</span>
                            </div>
                        ))}
                        {liveTranscript && (
                            <div className="transcript-entry live">
                                <span className="transcript-time">now</span>
                                <span className="transcript-text">{liveTranscript}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TranscriptPanel;
