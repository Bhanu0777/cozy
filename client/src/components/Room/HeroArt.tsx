import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, CloudRain, Flame, Disc, Volume2, Play } from 'lucide-react';
import { playPopSound, playSqueezeChime, ambiance } from '../../utils/sound';

export default function HeroArt() {
  const [moodA, setMoodA] = useState('🥰');
  const [moodB, setMoodB] = useState('🥺');
  const [theme, setTheme] = useState<'starry' | 'sunset' | 'sakura'>('starry');
  const [squeezing, setSqueezing] = useState(false);
  const [activeAmbiance, setActiveAmbiance] = useState<string | null>(null);

  const triggerSqueeze = () => {
    playSqueezeChime();
    setSqueezing(true);
    setTimeout(() => setSqueezing(false), 2400);
  };

  const cycleMoodA = () => {
    playPopSound();
    const list = ['🥰', '😊', '🥳', '💖', '✨', '😴'];
    setMoodA(list[(list.indexOf(moodA) + 1) % list.length]);
  };

  const cycleMoodB = () => {
    playPopSound();
    const list = ['🥺', '☕', '💖', '🥰', '🌸', '✨'];
    setMoodB(list[(list.indexOf(moodB) + 1) % list.length]);
  };

  const toggleSound = (type: 'rain' | 'fire' | 'lofi') => {
    if (activeAmbiance === type) {
      ambiance.stop();
      setActiveAmbiance(null);
    } else {
      ambiance.start(type, 0.2);
      setActiveAmbiance(type);
    }
  };

  return (
    <div className="hero-interactive-card">
      <div className="hero-card-header">
        <div className="card-dot-group">
          <span className="dot-red" />
          <span className="dot-yellow" />
          <span className="dot-green" />
        </div>
        <div className="hero-header-badge">
          <span className="pulse-ping" />
          <span>Live Interactive Preview</span>
        </div>
        <div className="theme-toggle-mini">
          <button
            type="button"
            className={theme === 'starry' ? 'active' : ''}
            onClick={() => setTheme('starry')}
            title="Starry Galaxy"
          >
            🌌
          </button>
          <button
            type="button"
            className={theme === 'sunset' ? 'active' : ''}
            onClick={() => setTheme('sunset')}
            title="Sunset Cafe"
          >
            🌅
          </button>
          <button
            type="button"
            className={theme === 'sakura' ? 'active' : ''}
            onClick={() => setTheme('sakura')}
            title="Sakura Glow"
          >
            🌸
          </button>
        </div>
      </div>

      <div className={`scene scene-mini theme-${theme}`}>
        {/* Sky / Window */}
        <div className="window">
          <span className="moon" />
          {theme === 'starry' && (
            <div className="stars-layer">
              {[10, 30, 55, 75, 20, 65, 88].map((l, i) => (
                <i
                  key={i}
                  className="star"
                  style={{
                    left: `${l}%`,
                    top: `${(i * 24 + 8) % 75}%`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </div>
          )}
          {theme === 'sakura' && (
            <div className="sakura-layer">
              {[15, 45, 75, 90].map((l, i) => (
                <span
                  key={i}
                  className="petal"
                  style={{ left: `${l}%`, animationDelay: `${i * 0.7}s` }}
                >
                  🌸
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lamp"><span className="glow" />🪔</div>
        <div className="plant">🪴</div>
        <div className="table">☕</div>

        <div className="sofa" aria-hidden="true">
          <span className="cushion" />
          <span className="cushion c2" />
        </div>

        {/* Clickable Avatars */}
        <motion.div
          className={`avatar ${squeezing ? 'bounce' : ''}`}
          style={{ left: '22%' }}
          onClick={cycleMoodA}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          title="Click to change mood"
          role="button"
          tabIndex={0}
        >
          <span className="bubble" key={moodA}>{moodA}</span>
          <span className="face a1">A</span>
          <div className="tag">
            <strong>Alex (you)</strong>
            <span className="status"><i className="dot on" />Online</span>
          </div>
        </motion.div>

        <motion.div
          className={`avatar ${squeezing ? 'bounce' : ''}`}
          style={{ left: '56%' }}
          onClick={cycleMoodB}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          title="Click to change mood"
          role="button"
          tabIndex={0}
        >
          <span className="bubble" key={moodB}>{moodB}</span>
          <span className="face a2">S</span>
          <div className="tag">
            <strong>Sam</strong>
            <span className="status"><i className="dot on" />Online</span>
          </div>
        </motion.div>

        {squeezing && (
          <>
            <span className="heart h1">❤️</span>
            <span className="heart h2">💜</span>
            <span className="heart h3">🩷</span>
            <div className="room-glow" />
          </>
        )}
      </div>

      {/* Interactive Toolbar below preview */}
      <div className="hero-card-footer">
        <div className="interactive-actions">
          <button
            type="button"
            className="hero-action-pill squeeze-action"
            onClick={triggerSqueeze}
          >
            <Heart size={14} className="heart-icon" />
            <span>Test Squeeze 🤗</span>
          </button>

          <div className="hero-audio-toggles">
            <button
              type="button"
              className={`hero-audio-pill ${activeAmbiance === 'rain' ? 'active' : ''}`}
              onClick={() => toggleSound('rain')}
              title="Play rain sound"
            >
              <CloudRain size={13} />
              <span>Rain</span>
            </button>
            <button
              type="button"
              className={`hero-audio-pill ${activeAmbiance === 'fire' ? 'active' : ''}`}
              onClick={() => toggleSound('fire')}
              title="Play fireplace sound"
            >
              <Flame size={13} />
              <span>Fire</span>
            </button>
            <button
              type="button"
              className={`hero-audio-pill ${activeAmbiance === 'lofi' ? 'active' : ''}`}
              onClick={() => toggleSound('lofi')}
              title="Play lofi static"
            >
              <Disc size={13} />
              <span>Lofi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
