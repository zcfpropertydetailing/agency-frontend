import React, { useState, useEffect, useRef } from 'react';

const API = process.env.REACT_APP_API_URL;

export default function AgentChat({ agent, token, client }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/api/agents/history/${agent.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{
          role: 'assistant',
          content: getGreeting(agent.id, client)
        }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: getGreeting(agent.id, client) }]);
    }
    setLoadingHistory(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agents/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentType: agent.id, message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I ran into an issue. Please try again in a moment.'
      }]);
    }
    setLoading(false);
  };

  if (loadingHistory) return (
    <div className="agent-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="loader"></div>
      </div>
    </div>
  );

  return (
    <div className="agent-page">
      <div className="agent-header">
        <div className={`agent-icon ${agent.color}`}>{agent.icon}</div>
        <div className="agent-header-text">
          <h2>{agent.name}</h2>
          <p>{agent.desc}</p>
        </div>
        <div className="agent-status">
          <div className="status-dot"></div>
          Active
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? agent.icon : '👤'}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">{agent.icon}</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <input
            className="chat-input"
            placeholder={`Message your ${agent.name.toLowerCase()}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function getGreeting(agentId, client) {
  const name = client?.business_name?.split(' ')[0] || 'there';
  const greetings = {
    website: `Hi! I'm your dedicated website agent. I'm here to build and manage a world-class website for ${client?.business_name || 'your business'} that genuinely represents your brand and converts visitors into customers.\n\nI'll take care of everything — design, content, SEO, and ongoing updates. You can ask me to change anything at any time and I'll handle it immediately.\n\nLet's start building something great. What's the exact name of your business as you'd like it to appear on your website?`,
    social: `Hey ${name}! I'm your social media agent. I'll be managing your Facebook and Instagram to build your brand, engage your community, and bring in new customers.\n\nI create all the content, schedule everything, and handle engagement — you don't have to touch a thing.\n\nLet's get started. Do you currently have a Facebook page or Instagram account for ${client?.business_name || 'your business'}?`,
    gbp: `Hi ${name}! I'm your Google Business Profile agent. I'll build and optimize your GBP listing so you show up when people in ${client?.location || 'your area'} search for ${client?.industry || 'your services'}.\n\nA fully optimized GBP is one of the highest ROI moves for a local business — it directly drives calls, website visits, and direction requests.\n\nDo you currently have a Google Business Profile set up for ${client?.business_name || 'your business'}?`,
    ads: `Hi ${name}! I'm your ads agent. I'll be running your Google and Meta advertising campaigns to bring in qualified leads for ${client?.business_name || 'your business'}.\n\nI handle everything — campaign setup, ad copy, targeting, optimization, and weekly reporting. Every dollar works as hard as possible.\n\nTo get started: what's your monthly advertising budget? Even $300–500/month produces strong results in a local market.`
  };
  return greetings[agentId] || `Hi! I'm your ${agentId} agent. How can I help you today?`;
}
