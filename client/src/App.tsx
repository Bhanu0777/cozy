import { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';

const Room = lazy(() => import('./pages/Room')); // heavy: socket + YouTube + animations

export default function App() {
  const loc = useLocation();
  return (
    <Suspense fallback={<p className="loading" role="status">Loading your snug room...</p>}>
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname.startsWith('/room') ? 'room' : loc.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
