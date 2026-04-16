import React, { useState, useEffect } from 'react';
import AgentChat from './AgentChat';

const API = process.env.REACT_APP_API_URL;

const AGENTS = [
  { id: 'website', name: 'Website Agent', icon: '🌐', desc: 'Builds and manages your professional website', color: 'website' },
  { id: 'social', name: 'Social Media Agent', icon: '📱', desc: 'Runs your Facebook and Instagram presence', color: 'social' },
  { id: 'gbp', name: 'Google Business Agent', icon: '📍', desc: 'Manages your Google Business Profile', color: 'gbp' },
  { id: 'ads', name: 'Ads Agent', icon: '🎯', desc: 'Runs your Google and Meta ad campaigns', color: 'ads' },
];

const TIER_AGENTS = {
  bundle: ['website', 'social', 'gbp', 'ads'],
  website: ['website'],
  social: ['social'],
  gbp: ['gbp'],
  ads: ['ads'],
};

export default function Dashboard({ session, client, onLogout }) {
  const [page, setPage] = useState('overview');
  const [metrics, setMetrics] = useState(null);

  const token = session?.access_token;
  const allowedAgents = TIER_AGENTS[client?.subscription_tier] || [];

  useEffect(() => {
    if (token) fetchMetrics();
  }, [token]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API}/api/metrics/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMetrics(data);
    } catch (e) {}
  };

  const renderPage = () => {
    if (page === 'overview') return <Overview client={client} metrics={metrics} allowedAgents={allowedAgents} setPage={setPage} />;
    const agent = AGENTS.find(a => a.id === page);
    if (agent) {
      if (!allowedAgents.includes(agent.id)) {
        return <LockedAgent agent={agent} />;
      }
      return <AgentChat agent={agent} token={token} client={client} />;
    }
    return <Overview client={client} metrics={metrics} allowedAgents={allowedAgents} setPage={setPage} />;
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div className="sidebar-logo-text">TopStep</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <button className={`sidebar-item ${page === 'overview' ? 'active' : ''}`} onClick={() => setPage('overview')}>
            <span className="sidebar-item-icon">◉</span> Overview
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Your Agents</div>
          {AGENTS.map(agent => (
            <button key={agent.id} className={`sidebar-item ${page === agent.id ? 'active' : ''}`} onClick={() => setPage(agent.id)}>
              <span className="sidebar-item-icon">{agent.icon}</span>
              {agent.name.replace(' Agent', '')}
              {!allowedAgents.includes(agent.id) && <span className="sidebar-badge">🔒</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="client-info">
            <div className="client-info-name">{client?.business_name || 'Your Business'}</div>
            <div className="client-info-tier">{client?.subscription_tier === 'bundle' ? 'Full Bundle' : client?.subscription_tier + ' plan'}</div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <span>↩</span> Sign out
          </button>
        </div>
      </div>

      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

function Overview({ client, metrics, allowedAgents, setPage }) {
  return (
    <>
      <div className="page-header">
        <h1>Good {getGreeting()}, {client?.business_name?.split(' ')[0] || 'there'} 👋</h1>
        <p>Here's what your AI agents are working on for you.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Website Visitors</div>
          <div className="metric-value">{metrics?.website_visitors || '—'}</div>
          <div className="metric-sub">This month</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Leads Generated</div>
          <div className="metric-value">{metrics?.leads_generated || '—'}</div>
          <div className="metric-sub">From ads + SEO</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Social Reach</div>
          <div className="metric-value">{metrics?.social_reach || '—'}</div>
          <div className="metric-sub">Across platforms</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ad ROAS</div>
          <div className="metric-value">{metrics?.ad_roas ? metrics.ad_roas + 'x' : '—'}</div>
          <div className="metric-sub">Return on ad spend</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">GBP Calls</div>
          <div className="metric-value">{metrics?.gbp_calls || '—'}</div>
          <div className="metric-sub">From Google listing</div>
        </div>
      </div>

      <div className="overview-grid">
        {AGENTS.map(agent => {
          const isActive = allowedAgents.includes(agent.id);
          return (
            <div key={agent.id} className={`agent-card-overview ${!isActive ? 'locked' : ''}`}
              onClick={() => isActive && setPage(agent.id)}>
              <div className="agent-card-top">
                <div className={`agent-card-icon ${agent.color}`}>{agent.icon}</div>
                <span className={`agent-card-status ${isActive ? 'active' : 'locked'}`}>
                  {isActive ? '● Active' : '🔒 Locked'}
                </span>
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.desc}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LockedAgent({ agent }) {
  return (
    <div className="agent-page">
      <div className="agent-header">
        <div className={`agent-icon ${agent.color}`}>{agent.icon}</div>
        <div className="agent-header-text">
          <h2>{agent.name}</h2>
          <p>{agent.desc}</p>
        </div>
      </div>
      <div className="locked-agent">
        <div className="locked-icon">🔒</div>
        <h3>This agent is not included in your current plan</h3>
        <p>Upgrade to the Full Bundle to unlock all 4 agents and get the complete digital presence solution.</p>
        <button className="upgrade-btn">Upgrade to Full Bundle</button>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
