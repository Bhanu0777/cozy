import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playSqueezeChime } from '../../utils/sound';

export default function SqueezeOverlay({
  event,
}: {
  event: { id: string; from: string } | null;
}) {
  useEffect(() => {
    if (event) {
      playSqueezeChime();
    }
  }, [event?.id]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="squeeze-overlay"
          role="status"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="squeeze-card-popup"
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <p style={{ fontSize: '2.5rem', marginBottom: 6 }}>🤗❤️</p>
            <h3>Virtual Hug Received!</h3>
            <p>
              <strong>{event.from}</strong> just sent you a warm squeeze!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
