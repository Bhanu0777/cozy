import { memo } from 'react';
import { motion } from 'framer-motion';
import { MOODS } from '../../utils/moods';
import { playPopSound } from '../../utils/sound';

function MoodPicker({
  value,
  onPick,
}: {
  value: string;
  onPick: (id: string) => void;
}) {
  const handlePick = (id: string) => {
    playPopSound();
    onPick(id);
  };

  return (
    <div className="mood-grid" role="group" aria-label="Choose your mood">
      {MOODS.map(m => {
        const selected = value === m.id;
        return (
          <motion.button
            key={m.id}
            className={`mood-btn ${selected ? 'is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => handlePick(m.id)}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <span className="mood-emoji" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="mood-text">{m.label}</span>
            {selected && (
              <motion.span
                layoutId="mood-glow-ring"
                className="mood-selected-indicator"
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default memo(MoodPicker);
