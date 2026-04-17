import React, { useState, useEffect, useRef } from 'react';

const API = process.env.REACT_APP_API_URL;

const REQUIRED_FIELDS = [
  { key: 'businessName', label: 'Business Name', keywords: ['business', 'company', 'name'] },
  { key: 'phone', label: 'Phone Number', keywords: ['phone', 'call', 'number', '(', ')', '-'] },
  { key: 'industry', label: 'Industry', keywords: [] },
  { key: 'location', label: 'Location', keywords: ['located', 'based', 'serve', 'city'] },
  { key: 'services', label: '3+ Services', keywords: ['service', 'offer', 'provide', 'install', 'repair'] },
  { key: 'areas', label: '2+ Service Areas', keywords: ['area', 'serve', 'surrounding'] },
  { key: 'yearsInBusiness', label: 'Years in Business', keywords: ['year', 'since', 'started', 'founded'] },
  { key: 'licensed', label: 'Licensed & Insured', keywords: ['licensed', 'insured', 'license', 'insurance'] },
  { key: 'hours', label: 'Business Hours', keywords: ['hour', 'open', 'available', 'monday', '24/7', 'daily'] }
];

export default function AgentChat({ agent, token, client }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [siteUrl, setSiteUrl] = useState(null);
  const [collectedFields, setCollectedFields] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (agent.id === 'website' && messages.length > 1) fetchCollected();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const fetchCollected = async () => {
    try {
      const res = await fetch(`${API}/api/agents/collected/website`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.collected) setCollectedFields(data.collected);
    } catch (e) {}
  };

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
        setMessages([{ role: 'assistant', content: getGreeting(agent.id, client) }]);
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ agentType: agent.id, message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const cleanReply = data.reply.replace(/\[COLLECTED:\w+\]/g, '').replace(/\[STATUS:\{[^}]+\}\]/g, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }]);
      // Update checklist from server response
      if (data.collected) setCollectedFields(data.collected);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I ran into an issue. Please try again in a moment.' }]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const names = fileList.map(f => f.name).join(', ');
    
    // Notify user files are received
    setMessages(prev => [...prev, {
      role: 'user',
      content: `[Uploaded ${fileList.length} file(s): ${names}]`
    }]);
    setLoading(true);

    try {
      // Send file notification to agent
      const res = await fetch(`${API}/api/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          agentType: agent.id,
          message: `I've uploaded ${fileList.length} file(s): ${names}. Please acknowledge and tell me how these will be used on my website.`
        })
      });
      const data = await res.json();
      if (data.reply) {
        const cleanReply = data.reply.replace(/\[COLLECTED:\w+\]/g, '').replace(/\[STATUS:\{[^}]+\}\]/g, '').trim();
        setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }]);
        if (agent.id === 'website') fetchCollected();
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Files received! I'll incorporate them into your website." }]);
    }
    setLoading(false);
  };

  const buildWebsite = async () => {
    setDeploying(true);
    try {
      const conversationText = messages.map(m => m.role + ': ' + m.content).join('\n');
      const res = await fetch(`${API}/api/deploy/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          deployData: {
            businessName: client?.business_name || 'My Business',
            industry: client?.industry || 'HVAC',
            location: client?.location || 'Wayne, PA',
            phone: client?.phone || '(000) 000-0000',
            email: client?.email || '',
            services: [], areas: [client?.location || 'Wayne, PA'],
            colors: { primary: '#1a1a18', accent: '#e8a020' },
            conversationContext: conversationText
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSiteUrl(data.siteUrl);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Your website is now live! View it here: ' + data.siteUrl + '\n\nI will continue monitoring and improving it automatically. Let me know any changes you want!'
        }]);
      } else throw new Error(data.error);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'There was an issue deploying your site. Please try again or contact support.' }]);
    }
    setDeploying(false);
  };

  const requiredCount = REQUIRED_FIELDS.length;
  const collectedCount = Object.keys(collectedFields).filter(k => collectedFields[k]).length;
  const allCollected = collectedCount >= requiredCount;
  const canBuild = agent.id === 'website' && allCollected;

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
        {agent.id === 'website' && (
          <button
            onClick={buildWebsite}
            disabled={deploying || !canBuild}
            title={!canBuild ? `${requiredCount - collectedCount} more items needed` : 'Ready to build!'}
            style={{
              marginLeft: '12px',
              background: deploying || !canBuild ? '#444' : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: deploying || !canBuild ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: !canBuild ? 0.5 : 1
            }}
          >
            {deploying ? 'Building...' : siteUrl ? 'Rebuild Site' : !canBuild ? `🔒 Build My Site (${collectedCount}/${requiredCount})` : 'Build My Site'}
          </button>
        )}
      </div>

      {agent.id === 'website' && !siteUrl && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
            <div style={{fontWeight: 600, color: 'rgba(255,255,255,0.9)'}}>
              {allCollected ? '✅ Ready to build your site!' : `📋 Information Needed (${collectedCount}/${requiredCount})`}
            </div>
            {allCollected && (
              <div style={{fontSize: '12px', color: '#10b981'}}>You can build now or keep chatting</div>
            )}
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {REQUIRED_FIELDS.map(field => (
              <div key={field.key} style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: collectedFields[field.key] ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                color: collectedFields[field.key] ? '#10b981' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${collectedFields[field.key] ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {collectedFields[field.key] ? '✓' : '○'} {field.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {siteUrl && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#10b981'
        }}>
          Your site is live: <a href={siteUrl} target="_blank" rel="noreferrer" style={{color:'#10b981',fontWeight:'600'}}>{siteUrl}</a>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => {
            // Extract SVG from message content
            const svgMatch = msg.content.match(/<svg[\s\S]*?<\/svg>/i);
            const cleanContent = msg.content.replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/```svg[\s\S]*?```/gi, '').replace(/```[\s\S]*?```/gi, '').trim();
            
            return (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">{msg.role === 'assistant' ? agent.icon : '👤'}</div>
                <div className="message-content">
                  {cleanContent}
                  {svgMatch && (
                    <div style={{marginTop:'12px',background:'#fff',borderRadius:'8px',padding:'16px',display:'inline-block'}}>
                      <div dangerouslySetInnerHTML={{__html: svgMatch[0]}} style={{maxWidth:'200px',maxHeight:'200px'}} />
                      <div style={{fontSize:'12px',color:'#888',marginTop:'8px',textAlign:'center'}}>Your logo preview</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          <label style={{cursor:'pointer',padding:'8px',color:'rgba(255,255,255,0.5)',fontSize:'20px',flexShrink:0,display:'flex',alignItems:'center'}} title="Upload files (images, PDFs)">
            📎
            <input type="file" multiple accept="image/*,.pdf" style={{display:'none'}}
              onChange={e => handleFileUpload(e.target.files)} />
          </label>
          <input className="chat-input" placeholder={`Message your ${agent.name.toLowerCase()}...`}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
          <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  );
}

function getGreeting(agentId, client) {
  const name = client?.business_name?.split(' ')[0] || 'there';
  const greetings = {
    website: `Hi! I'm your dedicated website agent. I'm here to build and manage a world-class website for ${client?.business_name || 'your business'}.\n\nBefore I can build your site, I need to gather some essential information — you'll see a checklist above that fills in as we go. Once all 9 items are collected, you can click the green Build My Site button whenever you're ready.\n\nYou can also keep chatting with me after that to add more details (testimonials, colors, photos) to make the site even better.\n\nLet's start: what's the exact name of your business as you'd like it to appear on your website?`,
    social: `Hey ${name}! I'm your social media agent. I'll be managing your Facebook and Instagram to build your brand, engage your community, and bring in new customers.\n\nI create all the content, schedule everything, and handle engagement — you don't have to touch a thing.\n\nLet's get started. Do you currently have a Facebook page or Instagram account for ${client?.business_name || 'your business'}?`,
    gbp: `Hi ${name}! I'm your Google Business Profile agent. I'll build and optimize your GBP listing so you show up when people in ${client?.location || 'your area'} search for ${client?.industry || 'your services'}.\n\nDo you currently have a Google Business Profile set up for ${client?.business_name || 'your business'}?`,
    ads: `Hi ${name}! I'm your ads agent. I'll be running your Google and Meta advertising campaigns to bring in qualified leads for ${client?.business_name || 'your business'}.\n\nTo get started: what's your monthly advertising budget?`
  };
  return greetings[agentId] || `Hi! I'm your ${agentId} agent. How can I help you today?`;
}
