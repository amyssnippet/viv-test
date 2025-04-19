import React, { useState } from 'react';

const Chatbot = () => {
    const [chatHistory, setChatHistory] = useState([]);
    const [botResponse, setBotResponse] = useState('');
    const [isListening, setIsListening] = useState(false); // Status indicator

    // API call to communicate with Ollama chatbot
    const fetchChatbotResponse = async (message) => {
        try {
            const response = await fetch('https://cp.cosinv.com:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error fetching chatbot response:', error);
            return 'मुझे समझने में परेशानी हो रही है। कृपया फिर से कोशिश करें।';
        }
    };

    // Speech-to-Text (STT) function with Hindi support
    const handleUserSpeech = () => {
        const recognition = new window.webkitSpeechRecognition(); // For Chrome
        recognition.lang = 'hi-IN'; // Set language to Hindi
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true); // Show listening status
        recognition.onend = () => setIsListening(false);  // Hide listening status

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setChatHistory([...chatHistory, { sender: 'user', message: transcript }]);
            
            const response = await fetchChatbotResponse(transcript);
            setBotResponse(response);
            setChatHistory([...chatHistory, { sender: 'bot', message: response }]);
            
            speak(response); // Trigger TTS automatically
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event);
            setIsListening(false);
        };

        recognition.start();
    };

    // Text-to-Speech (TTS) function with Hindi support
    const speak = (text) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN'; // Set language to Hindi
        utterance.rate = 1;
        utterance.pitch = 1;
        synth.speak(utterance);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h1>Chatbot (हिंदी)</h1>

            <button 
                onClick={handleUserSpeech} 
                style={{ 
                    margin: '10px', 
                    padding: '10px 20px', 
                    backgroundColor: isListening ? 'red' : 'green', 
                    color: 'white' 
                }}
            >
                {isListening ? '🎙️ सुन रहा है...' : '🎙️ बोलना शुरू करें'}
            </button>

            <div style={{ textAlign: 'left', marginTop: '20px' }}>
                {chatHistory.map((chat, index) => (
                    <p key={index} style={{ color: chat.sender === 'user' ? 'blue' : 'green' }}>
                        <strong>{chat.sender === 'user' ? 'आप' : 'बॉट'}:</strong> {chat.message}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default Chatbot;
