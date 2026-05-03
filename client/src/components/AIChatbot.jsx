import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

function AIChatbot({ onUpdateForm }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! Tell me how you want to travel. (e.g. "I am in a hurry to get to NIT Delhi")' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(
        `${API_URL}/api/v1/chat/query`,
        { message: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      if (data.extractedData) {
        onUpdateForm(data.extractedData);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Oops, something went wrong. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px',
          borderRadius: '50%', background: 'var(--accent-color)', color: '#fff',
          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '1.5rem',
          cursor: 'pointer', zIndex: 1000
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', width: '350px', height: '450px',
      background: 'var(--surface-color)', border: '1px solid var(--border-color)',
      borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden'
    }}>
      <div style={{ background: 'var(--accent-color)', color: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>TWT Assistant</h4>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{
              background: msg.sender === 'user' ? 'var(--accent-color)' : 'var(--bg-color)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-color)',
              padding: '0.75rem 1rem', borderRadius: '12px',
              borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
              border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)' }}>Typing...</div>}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginRight: '0.5rem' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '0 1rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default AIChatbot;
