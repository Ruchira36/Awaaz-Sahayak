import { useState, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';
import ChatBubbles from './ChatBubbles';

function UserPanel({
    chatHistory,
    isProcessing,
    onTranscript,
    onImageUpload,
    onGeneratePdf,
    isGeneratingPdf,
    filledCount,
    totalFields,
    onLiveTranscript
}) {
    const [textInput, setTextInput] = useState('');
    const fileInputRef = useRef(null);

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (textInput.trim() && !isProcessing) {
            onTranscript(textInput.trim());
            setTextInput('');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload(file);
            e.target.value = '';
        }
    };

    return (
        <div className="user-panel">
            <div className="panel-header">
                <h2>Your Application</h2>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${(filledCount / totalFields) * 100}%` }}
                    ></div>
                    <span className="progress-text">{filledCount}/{totalFields}</span>
                </div>
            </div>

            <ChatBubbles messages={chatHistory} isProcessing={isProcessing} />

            <div className="input-area">
                <div className="main-actions">
                    <VoiceRecorder
                        onTranscript={onTranscript}
                        onLiveTranscript={onLiveTranscript}
                        disabled={isProcessing}
                    />

                    <form className="text-input-form" onSubmit={handleTextSubmit}>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type your answer here..."
                            disabled={isProcessing}
                            className="text-input"
                        />
                        <button
                            type="submit"
                            disabled={!textInput.trim() || isProcessing}
                            className="send-button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </form>
                </div>

                <div className="secondary-actions">
                    <button
                        className="action-button upload-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Upload Document
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <button
                        className="action-button generate-button"
                        onClick={onGeneratePdf}
                        disabled={isGeneratingPdf || isProcessing}
                    >
                        {isGeneratingPdf ? (
                            <span className="spinner-small"></span>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        )}
                        Generate Final Form
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserPanel;
