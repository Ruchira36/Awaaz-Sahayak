import { useState, useRef, useCallback, useEffect } from 'react';
import UserPanel from './components/UserPanel';
import JudgeDashboard from './components/JudgeDashboard';
import { processTranscript, extractDocument, generatePdf } from './services/api';

const INITIAL_FORM = {
    applicant_name: '',
    father_or_spouse_name: '',
    gender: '',
    date_of_birth: '',
    annual_income: '',
    loan_amount: '',
    loan_purpose: '',
    address: '',
    id_number: '',
    phone_number: ''
};

const ALL_FIELDS = Object.keys(INITIAL_FORM);

const FIELD_LABELS = {
    applicant_name: 'Applicant Name',
    father_or_spouse_name: 'Father/Spouse Name',
    gender: 'Gender',
    date_of_birth: 'Date of Birth',
    annual_income: 'Annual Income',
    loan_amount: 'Loan Amount',
    loan_purpose: 'Loan Purpose',
    address: 'Address',
    id_number: 'ID Proof Number',
    phone_number: 'Phone Number'
};

function App() {
    const [formState, setFormState] = useState({ ...INITIAL_FORM });
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            message: 'Namaste! Main Awaaz Sahayak hoon. Main aapki loan application bharne mein madad karungi. Sabse pehle, aapka poora naam kya hai?'
        }
    ]);
    const [transcripts, setTranscripts] = useState([]);
    const [missingFields, setMissingFields] = useState([...ALL_FIELDS]);
    const [filledFields, setFilledFields] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [pdfBlob, setPdfBlob] = useState(null);

    // Use ref to always access latest formState in callbacks
    const formStateRef = useRef(formState);
    useEffect(() => { formStateRef.current = formState; }, [formState]);

    // Text-to-Speech function
    const speakText = useCallback((text) => {
        if (!window.speechSynthesis) return;
        // Cancel any currently speaking utterance
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        // Use en-IN (Indian English) for TTS — pronounces Hinglish/Roman text naturally
        // hi-IN expects Devanagari script and mispronounces Roman letters
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        // Prefer a female voice — look for female Indian English, then any female voice
        const femaleIndian = voices.find(v => v.lang === 'en-IN' && /female|woman|heera|neerja|aditi|priya/i.test(v.name));
        const anyIndian = voices.find(v => v.lang === 'en-IN');
        const anyFemale = voices.find(v => /female|woman|zira|heera|neerja|aditi|priya|samantha|karen/i.test(v.name));
        utterance.voice = femaleIndian || anyIndian || anyFemale || null;
        window.speechSynthesis.speak(utterance);
    }, []);

    // Speak the initial welcome message on load
    const hasWelcomed = useRef(false);
    useEffect(() => {
        // Voices may load asynchronously, wait for them
        const speak = () => {
            if (hasWelcomed.current) return;
            hasWelcomed.current = true;
            window.speechSynthesis.onvoiceschanged = null;
            speakText('Namaste! Main Awaaz Sahayak hoon. Main aapki loan application bharne mein madad karungi. Sabse pehle, aapka poora naam kya hai?');
        };
        if (window.speechSynthesis.getVoices().length > 0) {
            speak();
        } else {
            window.speechSynthesis.onvoiceschanged = speak;
        }
    }, [speakText]);

    const handleTranscript = useCallback(async (transcript) => {
        if (!transcript.trim()) return;

        // Ignore TTS playback loop catching own audio
        const lowerTranscript = transcript.toLowerCase();
        if (lowerTranscript.includes('loan application form taiyaar') ||
            lowerTranscript.includes('right side mein') ||
            lowerTranscript.includes('download kar sakte')) {
            return;
        }

        // Add to transcripts log
        setTranscripts(prev => [...prev, { text: transcript, time: new Date().toLocaleTimeString() }]);

        // Add user message to chat
        setChatHistory(prev => [...prev, { role: 'user', message: transcript }]);

        setIsProcessing(true);
        try {
            const result = await processTranscript(transcript, formStateRef.current);

            // Update form state
            if (result.updatedState) {
                setFormState(result.updatedState);
            }

            // Update field trackers
            if (result.filledFields) setFilledFields(result.filledFields);
            if (result.missingFields) setMissingFields(result.missingFields);

            // Add AI response to chat and speak it
            if (result.nextQuestion) {
                setChatHistory(prev => [...prev, { role: 'assistant', message: result.nextQuestion }]);
                speakText(result.nextQuestion);
            }
        } catch (error) {
            console.error('Processing error:', error);
            const errMsg = 'Maaf kijiye, ek chhoti si gadbad ho gayi. Kripya dobara bataiye.';
            setChatHistory(prev => [...prev, { role: 'assistant', message: errMsg }]);
            speakText(errMsg);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleImageUpload = useCallback(async (file) => {
        setIsProcessing(true);
        setChatHistory(prev => [...prev, { role: 'user', message: '[Document photo uploaded]' }]);

        try {
            const result = await extractDocument(file, formStateRef.current);

            if (result.extractedFields) {
                if (result.updatedState) {
                    setFormState(result.updatedState);
                    const newFilled = ALL_FIELDS.filter(k => result.updatedState[k] && result.updatedState[k].trim());
                    const newMissing = ALL_FIELDS.filter(k => !result.updatedState[k] || !result.updatedState[k].trim());
                    setFilledFields(newFilled);
                    setMissingFields(newMissing);
                } else {
                    setFormState(prev => {
                        const updated = { ...prev };
                        Object.entries(result.extractedFields).forEach(([key, val]) => {
                            if (val && val.trim()) {
                                updated[key] = val;
                            }
                        });

                        const newFilled = ALL_FIELDS.filter(k => updated[k] && updated[k].trim());
                        const newMissing = ALL_FIELDS.filter(k => !updated[k] || !updated[k].trim());
                        setFilledFields(newFilled);
                        setMissingFields(newMissing);

                        return updated;
                    });
                }

                const extractedStr = Object.entries(result.extractedFields)
                    .filter(([, v]) => v && v.trim())
                    .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
                    .join(', ');

                const docMsg = `Bahut accha! Document se yeh jaankari mili: ${extractedStr}.`;
                const finalMsg = result.nextQuestion ? `${docMsg} ${result.nextQuestion}` : docMsg;
                setChatHistory(prev => [...prev, { role: 'assistant', message: finalMsg }]);
                speakText(finalMsg);
            }

            if (result.rawText) {
                setTranscripts(prev => [...prev, { text: `[OCR]: ${result.rawText}`, time: new Date().toLocaleTimeString() }]);
            }
        } catch (error) {
            console.error('Document extraction error:', error);
            const docErrMsg = 'Document padne mein dikkat aayi. Kya aap clear photo dobara bhej sakte hain?';
            setChatHistory(prev => [...prev, { role: 'assistant', message: docErrMsg }]);
            speakText(docErrMsg);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleGeneratePdf = useCallback(async () => {
        setIsGeneratingPdf(true);
        try {
            const responseBlob = await generatePdf(formStateRef.current);
            // Ensure the blob has the correct PDF MIME type
            const pdfBlobData = new Blob([responseBlob], { type: 'application/pdf' });
            setPdfBlob(pdfBlobData);
            const url = URL.createObjectURL(pdfBlobData);
            setPdfUrl(url);
            const pdfMsg = 'Aapka loan application form taiyaar ho gaya hai! Aap ise right side mein dekh sakte hain aur download kar sakte hain.';
            setChatHistory(prev => [...prev, { role: 'assistant', message: pdfMsg }]);
            speakText(pdfMsg);
        } catch (error) {
            console.error('PDF generation error:', error);
            const pdfErrMsg = 'Form banane mein dikkat aayi. Kripya dobara koshish kijiye.';
            setChatHistory(prev => [...prev, { role: 'assistant', message: pdfErrMsg }]);
            speakText(pdfErrMsg);
        } finally {
            setIsGeneratingPdf(false);
        }
    }, []);

    const handleLiveTranscript = useCallback((text) => {
        setLiveTranscript(text);
    }, []);

    return (
        <div className="app-container">
            <div className="app-header">
                <div className="header-brand">
                    <div className="header-icon">A</div>
                    <div>
                        <h1>Awaaz Sahayak</h1>
                        <p>Voice-Powered Loan Application Assistant</p>
                    </div>
                </div>
                <div className="header-status">
                    <span className="status-dot"></span>
                    <span>{filledFields.length}/{ALL_FIELDS.length} Fields Complete</span>
                </div>
            </div>

            <div className="main-content">
                <UserPanel
                    chatHistory={chatHistory}
                    isProcessing={isProcessing}
                    onTranscript={handleTranscript}
                    onImageUpload={handleImageUpload}
                    onGeneratePdf={handleGeneratePdf}
                    isGeneratingPdf={isGeneratingPdf}
                    filledCount={filledFields.length}
                    totalFields={ALL_FIELDS.length}
                    onLiveTranscript={handleLiveTranscript}
                />
                <JudgeDashboard
                    transcripts={transcripts}
                    liveTranscript={liveTranscript}
                    formState={formState}
                    filledFields={filledFields}
                    missingFields={missingFields}
                    fieldLabels={FIELD_LABELS}
                    pdfUrl={pdfUrl}
                    pdfBlob={pdfBlob}
                    isProcessing={isProcessing}
                />
            </div>
        </div>
    );
}

export default App;
