import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('agency_session');
    const storedClient = localStorage.getItem('agency_client');
    if (stored && storedClient) {
      setSession(JSON.parse(stored));
      setClient(JSON.parse(storedClient));
    }
    setLoading(false);
  }, []);

  const handleLogin = (sessionData, clientData) => {
    setSession(sessionData);
    setClient(clientData);
    localStorage.setItem('agency_session', JSON.stringify(sessionData));
    localStorage.setItem('agency_client', JSON.stringify(clientData));
  };

  const handleLogout = () => {
    setSession(null);
    setClient(null);
    localStorage.removeItem('agency_session');
    localStorage.removeItem('agency_client');
  };

  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;

  return (
    <div className="App">
      {!session ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard session={session} client={client} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
