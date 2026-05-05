import { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const EXAMPLES = [
  'I want to go from Jalandhar to Patna on 20 May, 2 people, business',
  'Cheapest way to reach Delhi from Chandigarh tomorrow',
  'Family trip to Mumbai from Jaipur next week, 4 travelers',
];

// Simple markdown bold renderer
const renderText = (text) =>
  text.split('\n').map((line, i) => (
    <span key={i} style={{ display: 'block' }}>
      {line.split(/\*\*(.+?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )}
    </span>
  ));

function AIChatbot({ onUpdateForm }) {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👋 Hi! Tell me your travel plans in plain English and I\'ll fill the form for you.\n\nExample: **"I want to travel from Jalandhar to Delhi on 15 May for 2 people, business trip, prefer fastest."**' }
  ]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(
        `${API_URL}/api/v1/chat/query`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      if (data.extractedData && Object.keys(data.extractedData).length > 0) {
        onUpdateForm(data.extractedData);
      }
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Oops, something went wrong. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => { e.preventDefault(); sendMessage(input); };

  if (!isOpen) {
    return (
      <button
        id="chatbot-toggle"
        onClick={() => setIsOpen(true)}
        title="Open TWT Assistant"
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #007f73, #00a693)',
          color: '#fff', border: 'none',
          boxShadow: '0 4px 20px rgba(0,127,115,0.45)',
          fontSize: '1.4rem', cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      width: '370px', height: '520px',
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid rgba(0,127,115,0.2)',
      borderRadius: '16px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      overflow: 'hidden', backdropFilter: 'blur(8px)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #007f73, #00a693)',
        color: '#fff', padding: '0.9rem 1.2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>TWT Assistant</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Natural language trip planner</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0.2rem 0.4rem', borderRadius: '4px' }}
        >&times;</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fbfa' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.sender === 'bot' && (
              <span style={{ fontSize: '1.1rem', marginRight: '0.4rem', alignSelf: 'flex-end' }}>🤖</span>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '0.65rem 0.9rem',
              borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #007f73, #00a693)' : '#fff',
              color: msg.sender === 'user' ? '#fff' : '#1f2f3f',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: msg.sender === 'bot' ? '1px solid rgba(0,127,115,0.15)' : 'none',
            }}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            <div style={{ background: '#fff', border: '1px solid rgba(0,127,115,0.15)', borderRadius: '16px 16px 16px 4px', padding: '0.65rem 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0.1,0.2,0.3].map(d => (
                <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#007f73', animation: 'bounce 0.9s infinite', animationDelay: `${d}s`, display: 'inline-block' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Example suggestions */}
      <div style={{ padding: '0.5rem 1rem', background: '#f0f9f8', borderTop: '1px solid rgba(0,127,115,0.1)' }}>
        <div style={{ fontSize: '0.75rem', color: '#5a6b7e', marginBottom: '0.35rem', fontWeight: '600' }}>Quick examples:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => sendMessage(ex)}
              style={{
                background: 'none', border: '1px solid rgba(0,127,115,0.25)',
                borderRadius: '6px', padding: '0.3rem 0.6rem',
                fontSize: '0.75rem', color: '#007f73', cursor: 'pointer',
                textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{ display: 'flex', padding: '0.75rem 1rem', borderTop: '1px solid rgba(0,127,115,0.15)', background: '#fff', gap: '0.5rem' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe your trip..."
          style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #c8dae9', fontSize: '0.88rem' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #007f73, #00a693)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ↑
        </button>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}} />
    </div>
  );
}

export default AIChatbot;

