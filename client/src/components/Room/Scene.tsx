import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { moodOf } from '../../utils/moods';
import type { User } from '../../types';
import { CopyButton } from '../UI';

export type RoomTheme = 'starry' | 'sunset' | 'rainy' | 'sakura' | 'cabin';

type Props = {
  users: User[];
  me: string;
  code: string;
  squeezing: boolean;
};

const THEMES: { id: RoomTheme; name: string; icon: string; className: string; view: string }[] = [
  { id: 'starry', name: 'Starry night', icon: '✦', className: 'theme-starry', view: '✦  ·  ☾  ·  ✧' },
  { id: 'sunset', name: 'Sunset café', icon: '◒', className: 'theme-sunset', view: '☁  ◒  ☁' },
  { id: 'rainy', name: 'Rainy lo-fi', icon: '⌁', className: 'theme-rainy', view: '╲  ╲  ╲  ╲' },
  { id: 'sakura', name: 'Sakura glow', icon: '✿', className: 'theme-sakura', view: '✿  ·  ✿' },
  { id: 'cabin', name: 'Candle cabin', icon: '◉', className: 'theme-cabin', view: '♢  ◉  ♢' },
];

export default function Scene({ users, me, code, squeezing }: Props) {
  const [themeIdx, setThemeIdx] = useState(0);
  const [lamp, setLamp] = useState(true);

  const theme = THEMES[themeIdx];
  const mine = users.find(u => u.id === me);
  const partner = users.find(u => u.id !== me);

  const myMood = moodOf(mine?.mood ?? 'happy');
  const partnerMood = moodOf(partner?.mood ?? 'happy');

  const cycleTheme = () => {
    setThemeIdx((themeIdx + 1) % THEMES.length);
  };

  return (
    <div className={`live-scene-card room-card ${theme.className}`}>
      {/* Top presence and theme bar */}
      <div className="room-topbar">
        <div className="room-presence">
          <span className="live-dot" />
          <span>{users.length} / 2 here</span>
        </div>
        <button className="theme-chip" onClick={cycleTheme} aria-label="Change room theme">
          <span>{theme.icon}</span>
          {theme.name}
          <span className="chevron">⌄</span>
        </button>
      </div>

      {/* Handcrafted 2D Scene */}
      <div className="room-scene">
        <div className="wall-stars">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="window">
          <div className="window-view">{theme.view}</div>
          <div className="window-frame-v" />
          <div className="window-frame-h" />
        </div>

        <button
          className={`lamp ${lamp ? 'lamp-on' : ''}`}
          onClick={() => setLamp(!lamp)}
          aria-label="Toggle lamp"
          title="Click to toggle floor lamp"
        >
          <span className="lamp-shade" />
          <span className="lamp-stem" />
          <span className="lamp-base" />
        </button>

        <div className="plant" title="House plant">
          <span />
          <span />
          <span />
          <i />
        </div>

        <div className="shelf">
          <span>▥</span>
          <span>▥</span>
          <i />
        </div>

        {/* The Couch with Users */}
        <div className="couch">
          <div className="couch-back" />
          <div className="couch-seat" />
          <div className="couch-arm left" />
          <div className="couch-arm right" />
          <div className="couch-leg left" />
          <div className="couch-leg right" />

          {/* User 1 (Me) */}
          {mine && (
            <motion.div
              className="person person-one"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="thought">
                {myMood.emoji} {myMood.label}
              </div>
              <div className="head">{mine.name.slice(0, 1).toUpperCase()}</div>
              <div className="body" />
              <span className={`person-name ${mine.online ? '' : 'away'}`}>
                <i />
                {mine.name} (you)
              </span>
            </motion.div>
          )}

          {/* User 2 (Partner) */}
          {partner && (
            <motion.div
              className="person person-two"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="thought">
                {partnerMood.emoji} {partnerMood.label}
              </div>
              <div className="head">{partner.name.slice(0, 1).toUpperCase()}</div>
              <div className="body" />
              <span className={`person-name ${partner.online ? '' : 'away'}`}>
                <i />
                {partner.name}
              </span>
            </motion.div>
          )}

          <div className="couch-heart">♥</div>
        </div>

        {/* If partner is not yet in the room */}
        {!partner && (
          <div className="scene-waiting-pill">
            <h4>Waiting for your partner…</h4>
            <p>Share this 6-character room code:</p>
            <p className="code">{code}</p>
            <CopyButton text={code} label="Copy Code" />
          </div>
        )}

        <div className="coffee-table">
          <span className="mug">
            <i>≈</i>
          </span>
        </div>

        {/* Squeeze Heart Bloom Overlay */}
        <div className={`squeeze-bloom ${squeezing ? 'is-active' : ''}`}>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <strong>Squeeze sent! 🤗</strong>
        </div>
      </div>
    </div>
  );
}
