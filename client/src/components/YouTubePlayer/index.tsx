import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Clapperboard, Tv2, Music, Play } from 'lucide-react';
import { Button } from '../UI';
import { parseYouTubeId } from '../../utils/youtube';
import type { VideoCmd } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;
const loadApi = () =>
  (apiReady ??= new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => {
      apiReady = null;
      reject(new Error('yt'));
    };
    document.head.appendChild(s);
  }));

type Props = {
  cmd: VideoCmd | null;
  hasVideo: boolean;
  addedBy: string | null;
  onLoad: (url: string) => Promise<{ ok: boolean; error?: string }>;
  onEvent: (type: 'play' | 'pause' | 'seek', time: number) => void;
};

const COZY_PRESETS = [
  {
    title: 'Lofi Girl - Relax / Study ☕',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    icon: '☕',
  },
  {
    title: 'Studio Ghibli Piano Melodies 🎹',
    url: 'https://www.youtube.com/watch?v=XULUBg_Z540',
    icon: '🎹',
  },
  {
    title: 'Cozy Rain & Fireplace Ambience 🌧️',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    icon: '🌧️',
  },
  {
    title: 'Sunset Beach Walk 4K 🌅',
    url: 'https://www.youtube.com/watch?v=nepkQoR2xX8',
    icon: '🌅',
  },
];

export default function YouTubePlayer({
  cmd,
  hasVideo,
  addedBy,
  onLoad,
  onEvent,
}: Props) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [playerErr, setPlayerErr] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const ready = useRef(false);
  const pending = useRef<VideoCmd | null>(null);
  const quiet = useRef(0);
  const last = useRef({ time: 0, ts: 0, playing: false });
  const lastSeekSent = useRef(0);
  const evt = useRef(onEvent);
  evt.current = onEvent;

  const mute = (ms = 1200) => {
    quiet.current = Date.now() + ms;
  };
  const track = (time: number, playing: boolean) => {
    last.current = { time, ts: Date.now(), playing };
  };

  const apply = (c: VideoCmd) => {
    const p = player.current;
    if (!p || !ready.current) {
      pending.current = c;
      return;
    }
    mute();
    if (c.type === 'load' || c.type === 'sync') {
      const o = { videoId: c.videoId, startSeconds: c.time };
      c.playing ? p.loadVideoById(o) : p.cueVideoById(o);
      track(c.time, c.playing);
    } else if (c.type === 'seek') {
      p.seekTo(c.time, true);
      track(c.time, last.current.playing);
    } else if (c.type === 'play') {
      if (Math.abs(p.getCurrentTime() - c.time) > 1.5) p.seekTo(c.time, true);
      p.playVideo();
      track(c.time, true);
    } else {
      p.pauseVideo();
      p.seekTo(c.time, true);
      track(c.time, false);
    }
  };

  useEffect(() => {
    if (!cmd) return;
    if (player.current) return apply(cmd);
    if (cmd.type !== 'load' && cmd.type !== 'sync') return;
    pending.current = cmd;
    let dead = false;
    loadApi()
      .then(() => {
        if (dead || player.current || !host.current) return;
        const el = document.createElement('div');
        host.current.innerHTML = '';
        host.current.appendChild(el);
        player.current = new window.YT.Player(el, {
          videoId: (cmd as any).videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => {
              ready.current = true;
              if (pending.current) {
                const c = pending.current;
                pending.current = null;
                apply(c);
              }
            },
            onError: () => setPlayerErr(true),
            onStateChange: (e: any) => {
              if (Date.now() < quiet.current) return;
              const t = player.current.getCurrentTime();
              if (e.data === 1) {
                evt.current('play', t);
                track(t, true);
              } else if (e.data === 2) {
                evt.current('pause', t);
                track(t, false);
              }
            },
          },
        });
      })
      .catch(() => setPlayerErr(true));
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd?.seq]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = player.current;
      if (!p || !ready.current || Date.now() < quiet.current) return;
      const now = Date.now(),
        l = last.current;
      const actual = p.getCurrentTime();
      const expected = l.playing ? l.time + (now - l.ts) / 1000 : l.time;
      if (Math.abs(actual - expected) > 2 && now - lastSeekSent.current > 800) {
        lastSeekSent.current = now;
        evt.current('seek', actual);
      }
      track(actual, p.getPlayerState() === 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      player.current?.destroy?.();
      player.current = null;
      ready.current = false;
    },
    [],
  );

  const loadLink = async (targetUrl: string) => {
    if (!parseYouTubeId(targetUrl)) {
      return setErr("We couldn't recognize that YouTube link.");
    }
    setErr('');
    setBusy(true);
    const r = await onLoad(targetUrl);
    setBusy(false);
    if (r.ok) setUrl('');
    else setErr(r.error ?? "We couldn't recognize that YouTube link.");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await loadLink(url);
  };

  return (
    <section aria-label="Watch together" className="watch-section">
      <div className="watch-heading-row">
        <div className="watch-heading">
          <Tv2 size={18} aria-hidden style={{ color: 'var(--coral)' }} />
          <span>Synchronized Theater</span>
        </div>
        {hasVideo && (
          <span className="live-sync-pill">
            <span className="live-pulse-dot" />
            <span>Synced</span>
          </span>
        )}
      </div>

      <form className="watch-form" onSubmit={submit}>
        <div className="watch-input-wrap">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste any YouTube video or song link…"
            aria-label="YouTube link"
            inputMode="url"
          />
        </div>
        <Button disabled={busy || !url.trim()} variant="primary" className="watch-submit-btn">
          <Clapperboard size={15} aria-hidden />
          <span>{busy ? 'Loading…' : 'Play Together'}</span>
        </Button>
      </form>

      {err && (
        <p className="err" role="alert" style={{ marginBottom: 8 }}>
          ⚠ {err}
        </p>
      )}

      {hasVideo ? (
        <div className="player-cinema-wrap">
          <div className="watch-meta">
            <span className="watch-badge">
              🎬 Watching together
            </span>
            {addedBy && <span className="watch-added-by">Added by {addedBy}</span>}
          </div>
          <div className="player-frame">
            <div ref={host} className="player-host" />
          </div>
          {playerErr && (
            <p className="err" role="alert" style={{ marginTop: 10 }}>
              ⚠ This video can't be played in embedded mode. Try another link.
            </p>
          )}
        </div>
      ) : (
        <div className="watch-empty-card">
          <div className="watch-empty-icon">
            <Music size={22} aria-hidden />
          </div>
          <h4>What would you like to watch together?</h4>
          <p className="watch-empty-desc">
            Paste a link above, or choose from these cozy recommendations:
          </p>

          <div className="preset-grid">
            {COZY_PRESETS.map(preset => (
              <button
                key={preset.url}
                type="button"
                className="preset-pill"
                onClick={() => loadLink(preset.url)}
                disabled={busy}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-title">{preset.title}</span>
                <Play size={12} className="preset-arrow" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
