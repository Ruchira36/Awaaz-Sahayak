import { useEffect, useRef } from 'react';

function ChatBubbles({ messages, isProcessing }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    return (
        <div className="chat-bubbles">
            {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className="bubble-avatar">
                        {msg.role === 'assistant' ? 'A' : 'U'}
                    </div>
                    <div className="bubble-content">
                        <p>{msg.message}</p>
                    </div>
                </div>
            ))}
            {isProcessing && (
                <div className="chat-bubble assistant">
                    <div className="bubble-avatar">A</div>
                    <div className="bubble-content">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}

export default ChatBubbles;
