import React, { useState, useEffect } from 'react';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // For Fuzzy results download

  useEffect(() => {
    let storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      storedUserId = `user-${Date.now()}`;
      localStorage.setItem('user_id', storedUserId);
    }
    setUserId(storedUserId);

    const storedSessionId = localStorage.getItem('session_id');
    if (storedSessionId) {
      setSessionId(parseInt(storedSessionId));
    }
  }, []);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);

    try {
      const response = await fetch('https://fountain-ai-chatbot-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: userInput,
        }),
      });

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem('session_id', data.session_id);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: Could not get response.' }]);
    } finally {
      setUserInput('');
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ width: '95%', maxWidth: '600px', margin: '2rem auto', fontFamily: "'Merriweather', serif" }}>
      <h2 style={{ fontWeight: '700', textAlign: 'center' }}>
        <strong>Fountain AI Chatbot</strong>
      </h2>

      <img
        src="/Fountain AI LLC - Logo.png"
        alt="Fountain AI Logo"
        style={{
          maxWidth: '120px',
          marginBottom: '1rem',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      />

      {/* Chat Input & Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <input
          type="text"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask something..."
          style={{
            flex: '1 1 100%',
            padding: '0.75rem',
            fontSize: '1rem',
            boxSizing: 'border-box',
            maxWidth: '100%'
          }}
        />
        <div style={{
          display: 'flex',
          flex: '1 1 100%',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={sendMessage}
            style={{
              padding: '0.75rem',
              fontSize: '1rem',
              flex: '1 1 50%',
              maxWidth: '200px'
            }}
          >
            Send
          </button>
          <button
            onClick={clearChat}
            style={{
              padding: '0.75rem',
              fontSize: '1rem',
              flex: '1 1 50%',
              maxWidth: '200px'
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Display */}
      <div style={{
        textAlign: 'left',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '0 1rem',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '0.5rem 0' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Fountain AI'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>Fountain AI Chatbot is thinking...</div>}
      </div>

      {/* Excel File Upload */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <h4>Upload Excel for Fuzzy Matching</h4>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button
          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          onClick={async () => {
            if (!selectedFile) {
              alert("Please select a file first.");
              return;
            }

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
              const response = await fetch('http://localhost:8000/fuzzy-match', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) throw new Error('Upload failed');

              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'fuzzy_matched.xlsx';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (error) {
              alert('❌ Error uploading file for fuzzy matching.');
              console.error(error);
            }
          }}
        >
          Submit for Matching
        </button>

        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Your Excel file should have columns: <strong>Messy Name</strong> and <strong>Correct Name</strong>
        </p>
      </div>
    </div>
  );
}

export default Chatbot;
