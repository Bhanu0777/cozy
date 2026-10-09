import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Home as HomeIcon,
  MessageCircle,
  Clapperboard,
  Heart,
  HeartHandshake,
  LogOut,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { clearSession, loadSession } from '../services/session';
import Scene from '../components/Room/Scene';
import Chat from '../components/Chat';
import YouTubePlayer from '../components/YouTubePlayer';
import MoodPicker from '../components/MoodPicker';
import SqueezeOverlay from '../components/Squeeze';
import AmbianceBar from '../components/Room/AmbianceBar';
import { Toast, CopyButton } from '../components/UI';
import type { Session } from '../types';
import { playSqueezeChime, playPopSound } from '../utils/sound';

type Tab = 'room' | 'chat' | 'watch' | 'mood';
const tabs = [
  ['room', 'Room', HomeIcon],
  ['chat', 'Chat', MessageCircle],
  ['watch', 'Watch', Clapperboard],
  ['mood', 'Mood', Heart],
] as const;

export default function Room() {
  const { roomId = '' } = useParams();
  const code = roomId.toUpperCase();
  const session = loadSession(code);
  if (!session)
    return <Navigate to={`/join?code=${encodeURIComponent(code.slice(0, 6))}`} replace />;
  return <RoomInner session={session} />;
}

function RoomInner({ session }: { session: Session }) {
  const nav = useNavigate();
  const r = useRoomSocket(session);
  const [tab, setTab] = useState<Tab>('room');
  const [toast, setToast] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [squeezing, setSqueezing] = useState(false);
  const toastTimer = useRef<number>();

  const say = (t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!r.squeezeIn) return;
    setSqueezing(true);
    const t = window.setTimeout(() => {
      r.clearSqueeze();
      setSqueezing(false);
    }, 3600);
    return () => window.clearTimeout(t);
  }, [r.squeezeIn?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (r.denied) clearSession(session.code);
  }, [r.denied, session.code]);

  if (r.denied) {
    return (
      <main className="room-modal" style={{ margin: '80px auto' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: 10 }}>😔</p>
        <h2>
          {r.denied === 'room_not_found'
            ? "That room doesn't exist."
            : "We couldn't get you in."}
        </h2>
        <p style={{ marginTop: 8, marginBottom: 24, color: 'var(--muted)' }}>
          Check the 6-character code, or create a brand new room.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link className="button button-primary" to="/join">
            Join a Room
          </Link>
          <Link className="button button-light" to="/create">
            Create a Room
          </Link>
        </div>
      </main>
    );
  }

  const mine = r.users.find(u => u.id === r.me);

  const sendSqueeze = async () => {
    if (cooldown > 0) return;
    playSqueezeChime();
    const res = await r.squeeze();
    if (res.ok) {
      say('Squeeze sent ❤️');
      setCooldown(Math.ceil((res.retryMs ?? 5000) / 1000));
      setSqueezing(true);
      window.setTimeout(() => setSqueezing(false), 1500);
    } else if (res.retryMs) {
      setCooldown(Math.ceil(res.retryMs / 1000));
    } else {
      say(res.error ?? 'COZY is having trouble connecting. Please try again.');
    }
  };

  const confirmLeave = () => {
    if (confirm('Leave the room? You can always return anytime with your code.')) {
      playPopSound();
      nav('/');
    }
  };

  return (
    <div className="room-page" data-tab={tab}>
      {/* Top Navbar */}
      <header className="room-top">
        <div className="room-top-left">
          <Link
            to="/"
            className="brand"
            aria-label="Go to the home page"
            title="Go to the home page"
            onClick={e => {
              e.preventDefault();
              confirmLeave();
            }}
          >
            <span className="brand-mark">
              <span />
              <span />
            </span>
            <span>cozy</span>
          </Link>
          <div className="room-name-badge">
            <span className="room-title">{session.roomName || 'Our Cozy Place'}</span>
            <span className="room-presence-tag">
              <Users size={12} />
              <span>{r.users.length} / 2 here</span>
            </span>
          </div>
        </div>

        {/* Ambient audio player toolbar */}
        <AmbianceBar />

        <div className="room-top-right">
          <CopyButton text={session.code} label={session.code} />
          <button
            className="button button-light leave-btn"
            onClick={confirmLeave}
            aria-label="Leave room"
            title="Leave room"
          >
            <LogOut size={15} aria-hidden /> <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Connection banner */}
      <AnimatePresence>
        {r.status !== 'connected' && (
          <motion.div
            className="banner"
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {r.status === 'connecting'
              ? '⏳ Connecting to room…'
              : '🔄 Connection interrupted. Reconnecting…'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Room Grid */}
      <div className="room-grid">
        <div className="pane pane-room">
          <Scene
            users={r.users}
            me={r.me}
            code={session.code}
            squeezing={squeezing}
          />
        </div>

        <div className="pane pane-watch">
          <YouTubePlayer
            cmd={r.cmd}
            hasVideo={r.hasVideo}
            addedBy={r.addedBy}
            onLoad={r.loadVideo}
            onEvent={r.videoEvent}
          />
        </div>

        <div className="pane pane-mood">
          <div className="mood-header">
            <Heart size={16} style={{ color: 'var(--coral)' }} aria-hidden />
            <h2>How are you feeling right now?</h2>
          </div>
          <MoodPicker value={mine?.mood ?? 'happy'} onPick={r.setMood} />
        </div>

        <div className="pane pane-chat">
          <Chat
            messages={r.messages}
            me={r.me}
            typingName={r.typingName}
            onSend={r.sendMessage}
            onTyping={r.setTyping}
          />
        </div>
      </div>

      {/* Floating Squeeze Button */}
      <motion.button
        className="squeeze-btn"
        onClick={sendSqueeze}
        disabled={cooldown > 0 || r.users.length < 2}
        aria-label="Send a squeeze"
        whileTap={{ scale: 0.93 }}
        whileHover={{ scale: 1.05 }}
      >
        <HeartHandshake size={20} aria-hidden />
        {cooldown > 0 ? (
          <>
            <span>Squeeze sent</span>
            <span className="squeeze-cooldown">({cooldown}s)</span>
          </>
        ) : (
          <span>Send a squeeze ♥</span>
        )}
      </motion.button>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Room sections">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              playPopSound();
              setTab(id);
            }}
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <SqueezeOverlay event={r.squeezeIn} />
      <Toast text={toast} />
    </div>
  );
}
