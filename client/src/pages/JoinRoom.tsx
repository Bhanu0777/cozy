import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Button } from '../components/UI';
import { joinRoom } from '../services/api';
import { loadSession, saveSession } from '../services/session';
import { playPopSound, playSqueezeChime } from '../utils/sound';

export default function JoinRoom() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('code') ?? '').toUpperCase().slice(0, 6));
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return setErr('Please enter the 6-character room code.');
    if (!name.trim()) return setErr('Please enter your nickname.');
    playPopSound();

    if (loadSession(c)) {
      playSqueezeChime();
      return nav(`/room/${c}`);
    }

    setErr('');
    setBusy(true);
    try {
      const s = await joinRoom(c, name.trim());
      saveSession(s);
      playSqueezeChime();
      nav(`/room/${s.code}`);
    } catch (x) {
      setErr((x as Error).message);
    }
    setBusy(false);
  };

  return (
    <Page>
      <nav className="nav-shell">
        <Link to="/" className="brand" aria-label="Go to the home page" title="Go to the home page">
          <span className="brand-mark">
            <span />
            <span />
          </span>
          <span>cozy</span>
        </Link>
        <div className="nav-actions">
          <Link to="/create" className="join-link">
            Create a room
          </Link>
        </div>
      </nav>

      <div className="modal-backdrop" style={{ position: 'static', minHeight: '100vh' }}>
        <div className="room-modal">
          <div className="modal-icon">
            <span />
            <span />
          </div>
          <div className="section-kicker">COME ON IN</div>
          <h2>Join their room.</h2>
          <p>Enter the 6-character code they sent you and pick a nickname.</p>

          <form onSubmit={submit}>
            <label>
              Room code
              <input
                className="code-input"
                value={code}
                onChange={e =>
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 6),
                  )
                }
                placeholder="S N U G 4 2"
                maxLength={6}
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
            </label>

            <label>
              Your nickname
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Jamie, Taylor, Babe"
                maxLength={18}
                autoComplete="nickname"
                required
              />
            </label>

            {err && <p className="err">⚠ {err}</p>}

            <Button type="submit" disabled={busy}>
              {busy ? 'Connecting to seat…' : 'Take my seat →'}
            </Button>
          </form>

          <p style={{ marginTop: 20, fontSize: '11px', color: 'var(--muted)' }}>
            Don't have a code?{' '}
            <Link to="/create" style={{ fontWeight: 700, color: 'var(--coral)' }}>
              Create a room
            </Link>
          </p>
        </div>
      </div>
    </Page>
  );
}
