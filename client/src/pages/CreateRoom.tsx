import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, Button, CopyButton } from '../components/UI';
import { createRoom } from '../services/api';
import { saveSession } from '../services/session';
import type { Session } from '../types';
import { playPopSound, playSqueezeChime } from '../utils/sound';

export default function CreateRoom() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<Session | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr('Please enter your name.');
    setErr('');
    setBusy(true);
    playPopSound();
    try {
      const s = await createRoom(name.trim(), roomName.trim());
      saveSession(s);
      setMade(s);
      playSqueezeChime();
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
          <Link to="/join" className="join-link">
            Join a room
          </Link>
        </div>
      </nav>

      <div className="modal-backdrop" style={{ position: 'static', minHeight: '100vh' }}>
        <div className="room-modal">
          {made ? (
            <div className="created-state">
              <div className="modal-icon">
                <span />
                <span />
              </div>
              <div className="section-kicker">YOUR ROOM IS READY</div>
              <h2>Send them this code.</h2>
              <div className="created-code" aria-live="polite">
                {made.code}
              </div>
              <p>
                Your room is holding two seats. Share this code with your favorite person.
              </p>
              <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                <CopyButton text={made.code} label="Copy 6-digit code" />
                <Button onClick={() => nav(`/room/${made.code}`)}>
                  Enter the room →
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="modal-icon">
                <span />
                <span />
              </div>
              <div className="section-kicker">MAKE A ROOM FOR TWO</div>
              <h2>Your cozy corner.</h2>
              <p>Give us just enough to save your seat.</p>
              <form onSubmit={submit}>
                <label>
                  Your nickname
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Mia, Alex, Honey"
                    maxLength={18}
                    autoFocus
                    required
                  />
                </label>
                <label>
                  Room name <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '10px' }}>(optional)</span>
                  <input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="e.g. Sunday Tea & Movie"
                    maxLength={24}
                  />
                </label>
                {err && <p className="err">⚠ {err}</p>}
                <Button type="submit" disabled={busy}>
                  {busy ? 'Creating sanctuary…' : 'Create my room →'}
                </Button>
              </form>
              <small>No account. No tracking. No awkward setup.</small>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
