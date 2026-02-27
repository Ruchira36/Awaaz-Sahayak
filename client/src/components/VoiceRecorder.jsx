import { useState, useRef } from 'react';

function VoiceRecorder({ onTranscript, onLiveTranscript, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef(null);

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Your browser does not support speech recognition. Please use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        // en-IN = Indian English: recognizes Hindi-accented speech, outputs Roman/English letters (Hinglish)
        // This is exactly what we need — user speaks Hindi, system gets "Mera naam Sunita hai" not "मेरा नाम सुनीता है"
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (interim) {
                setInterimText(interim);
                onLiveTranscript && onLiveTranscript(interim);
            }

            if (final) {
                setInterimText('');
                onLiveTranscript && onLiveTranscript('');
                onTranscript(final);
                // Stop after getting a final result
                recognition.stop();
                setIsRecording(false);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            setInterimText('');
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access in your browser settings.');
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="voice-recorder">
            <button
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={disabled}
                title={isRecording ? 'Stop recording' : 'Start recording'}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            </button>
            {isRecording && (
                <div className="recording-indicator">
                    <div className="pulse-ring"></div>
                    <span>Listening...</span>
                </div>
            )}
            {interimText && (
                <div className="interim-text">{interimText}</div>
            )}
        </div>
    );
}

export default VoiceRecorder;
