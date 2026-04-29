import { useState } from 'react';

const Flame = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#c8621a">
    <path d="M12 2C9 7 6 9 6 14a6 6 0 0012 0c0-3-1.5-5-2-7-1 2-2 3-4 3 0-3 0-6 0-8z"/>
  </svg>
);

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) return onLogin();
      setError(data.error || 'Invalid password');
    } catch {
      setError('Connection error — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#07090f', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Jost', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Jost:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: 1px solid #c8621a; }
      `}</style>

      <div style={{ background: '#131e2e', border: '1px solid #1e2e42', borderRadius: 12,
        padding: '48px 40px', width: '100%', maxWidth: 380, textAlign: 'center' }}>

        <div style={{ marginBottom: 20 }}>
          <Flame size={48} />
        </div>

        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600,
          color: '#d4c5b0', marginBottom: 6 }}>
          Bonfire Oyster Co.
        </div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#7a8ea8', marginBottom: 36 }}>
          Inventory &amp; Ordering
        </div>

        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Team password"
            required
            style={{ width: '100%', background: '#182438', border: '1px solid #1e2e42',
              borderRadius: 4, padding: '12px 14px', color: '#e8e2d8', fontSize: 14,
              fontFamily: "'Jost', sans-serif", marginBottom: 14 }}
          />

          {error && (
            <div style={{ color: '#d94f4f', fontSize: 13, marginBottom: 14 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', background: '#c8621a',
            border: 'none', borderRadius: 4, padding: '12px', color: '#fff', fontSize: 13,
            fontWeight: 600, letterSpacing: '0.05em', cursor: loading ? 'default' : 'pointer',
            fontFamily: "'Jost', sans-serif", opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
