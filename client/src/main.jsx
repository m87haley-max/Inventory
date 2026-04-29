import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Login from './Login.jsx';

function Root() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setAuth(d.authenticated))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) {
    return (
      <div style={{ background: '#07090f', minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7a8ea8', fontFamily: "'Jost', sans-serif", fontSize: 14 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!auth) return <Login onLogin={() => setAuth(true)} />;
  return <App onLogout={() => setAuth(false)} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
);
