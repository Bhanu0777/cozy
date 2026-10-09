import { useState } from 'react';
import { Volume2, VolumeX, CloudRain, Flame, Disc, Moon, Sparkles } from 'lucide-react';
import { ambiance, toggleMute, isSoundEnabled } from '../../utils/sound';

type AmbianceMode = 'rain' | 'fire' | 'lofi' | 'night' | null;

export default function AmbianceBar() {
  const [active, setActive] = useState<AmbianceMode>(null);
  const [volume, setVolume] = useState(0.25);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleSelect = (mode: 'rain' | 'fire' | 'lofi' | 'night') => {
    if (active === mode) {
      ambiance.stop();
      setActive(null);
    } else {
      ambiance.start(mode, volume);
      setActive(mode);
    }
  };

  const handleVolume = (val: number) => {
    setVolume(val);
    ambiance.setVolume(val);
  };

  const handleMuteToggle = () => {
    const next = toggleMute();
    setSoundOn(next);
  };

  return (
    <div className="ambiance-bar" role="region" aria-label="Cozy Ambiance Soundscape">
      <div className="ambiance-title">
        <Sparkles size={14} className="accent-icon" aria-hidden />
        <span>Cozy Ambiance</span>
      </div>

      <div className="ambiance-buttons">
        <button
          type="button"
          className={`ambiance-pill ${active === 'rain' ? 'active' : ''}`}
          onClick={() => handleSelect('rain')}
          title="Gentle Rain sound"
        >
          <CloudRain size={14} aria-hidden />
          <span>Rain</span>
        </button>

        <button
          type="button"
          className={`ambiance-pill ${active === 'fire' ? 'active' : ''}`}
          onClick={() => handleSelect('fire')}
          title="Cozy Fireplace sound"
        >
          <Flame size={14} aria-hidden />
          <span>Fireplace</span>
        </button>

        <button
          type="button"
          className={`ambiance-pill ${active === 'lofi' ? 'active' : ''}`}
          onClick={() => handleSelect('lofi')}
          title="Lofi Vinyl Static"
        >
          <Disc size={14} aria-hidden />
          <span>Lofi</span>
        </button>

        <button
          type="button"
          className={`ambiance-pill ${active === 'night' ? 'active' : ''}`}
          onClick={() => handleSelect('night')}
          title="Night Breeze sound"
        >
          <Moon size={14} aria-hidden />
          <span>Night</span>
        </button>
      </div>

      {active && (
        <div className="ambiance-slider-wrap">
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={volume}
            onChange={e => handleVolume(parseFloat(e.target.value))}
            aria-label="Ambiance volume"
            className="ambiance-slider"
          />
        </div>
      )}

      <button
        type="button"
        className="sound-fx-toggle"
        onClick={handleMuteToggle}
        title={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
        aria-label="Sound effects toggle"
      >
        {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </button>
    </div>
  );
}
