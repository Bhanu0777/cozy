import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/UI';
import { createRoom, joinRoom } from '../services/api';
import { saveSession, loadSession } from '../services/session';
import { playPopSound, playSqueezeChime, ambiance } from '../utils/sound';

type Theme = {
  name: string;
  icon: string;
  className: string;
  view: string;
};

const themes: Theme[] = [
  { name: 'Starry night', icon: '✦', className: 'theme-starry', view: '✦  ·  ☾  ·  ✧' },
  { name: 'Sunset café', icon: '◒', className: 'theme-sunset', view: '☁  ◒  ☁' },
  { name: 'Rainy lo-fi', icon: '⌁', className: 'theme-rainy', view: '╲  ╲  ╲  ╲' },
  { name: 'Sakura glow', icon: '✿', className: 'theme-sakura', view: '✿  ·  ✿' },
  { name: 'Candle cabin', icon: '◉', className: 'theme-cabin', view: '♢  ◉  ♢' },
];

const features = [
  {
    number: '01',
    eyebrow: 'Perfectly in sync',
    title: 'Same moment, no countdown.',
    body: 'Press play, pause, or skip and it happens for both of you in under 50ms.',
    art: 'sync',
  },
  {
    number: '02',
    eyebrow: 'Soft little signals',
    title: 'Send a squeeze, feel the love.',
    body: 'A tiny burst of warmth that blooms across their screen. No words needed.',
    art: 'squeeze',
  },
  {
    number: '03',
    eyebrow: 'Made for privacy',
    title: 'Just two. No audience.',
    body: 'No accounts, no feed, no tracking. Rooms disappear when you both leave.',
    art: 'privacy',
  },
  {
    number: '04',
    eyebrow: 'A room that breathes',
    title: 'Mix your own atmosphere.',
    body: 'Layer rain, a gentle fire, vinyl crackle, or night breeze. Each sound is made live.',
    art: 'sound',
  },
];

const faq = [
  [
    'Is COZY really private?',
    'Yes. There are no accounts, profiles, ads, or tracking. Rooms are temporary and their links stop working after both guests leave.',
  ],
  [
    'Does it work on phones?',
    'It does. COZY adapts to smaller screens, so you can share a room from your phone, tablet, or laptop.',
  ],
  [
    'What can we watch together?',
    'Paste any YouTube link, or choose one of our cozy recommendations for music, rain, and gentle background videos.',
  ],
  [
    'What if a third person gets the link?',
    'Every room has exactly two seats. Once they are filled, no one else can enter—even with the code.',
  ],
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2c.5 5.8 4.2 9.5 10 10-5.8.5-9.5 4.2-10 10-.5-5.8-4.2-9.5-10-10 5.8-.5 9.5-4.2 10-10Z" />
    </svg>
  );
}

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Go to the home page" title="Go to the home page">
      <span className="brand-mark">
        <span />
        <span />
      </span>
      <span>cozy</span>
    </Link>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'light' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      className={`button button-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function HeroRoom({
  theme,
  onSqueeze,
  squeezed,
}: {
  theme: Theme;
  onSqueeze: () => void;
  squeezed: boolean;
}) {
  const [lamp, setLamp] = useState(true);
  const [ambience, setAmbience] = useState(false);

  const toggleAmbience = () => {
    if (ambience) {
      ambiance.stop();
      setAmbience(false);
    } else {
      ambiance.start('rain', 0.25);
      setAmbience(true);
    }
  };

  return (
    <div
      className={`room-card spotlight-card ${theme.className}`}
      onPointerMove={event => {
        if (event.pointerType === 'touch') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
      }}
    >
      <div className="room-topbar">
        <div className="room-presence">
          <span className="live-dot" />
          <span>2 here</span>
        </div>
      </div>

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
        >
          <span className="lamp-shade" />
          <span className="lamp-stem" />
          <span className="lamp-base" />
        </button>
        <div className="plant">
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

        <div className="couch">
          <div className="couch-back" />
          <div className="couch-seat" />
          <div className="couch-arm left" />
          <div className="couch-arm right" />
          <div className="couch-leg left" />
          <div className="couch-leg right" />
          <div className="person person-one">
            <div className="thought">feeling soft</div>
            <div className="head">M</div>
            <div className="body" />
            <span className="person-name">
              <i />
              Mia
            </span>
          </div>
          <div className="person person-two">
            <div className="thought">happy you're here</div>
            <div className="head">J</div>
            <div className="body" />
            <span className="person-name">
              <i />
              Jamie
            </span>
          </div>
          <div className="couch-heart">♥</div>
        </div>

        <div className="coffee-table">
          <span className="mug">
            <i>≈</i>
          </span>
        </div>

        <div className={`squeeze-bloom ${squeezed ? 'is-active' : ''}`}>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <strong>Squeeze sent!</strong>
        </div>
      </div>

      <div className="room-controls">
        <button
          className={`sound-toggle ${ambience ? 'playing' : ''}`}
          onClick={toggleAmbience}
        >
          <span className="sound-icon">{ambience ? 'Ⅱ' : '▶'}</span>
          <span>
            <small>AMBIENCE</small>
            {ambience ? 'Rain + fireplace' : 'Press to play'}
          </span>
          <span className="sound-waves">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
        <button className="squeeze-button" onClick={onSqueeze}>
          <span>♥</span> Send a squeeze
        </button>
      </div>
    </div>
  );
}

function MiniArt({ type }: { type: string }) {
  if (type === 'sync') {
    return (
      <div className="mini-art sync-art">
        <span>YOU</span>
        <i>▶</i>
        <b />
        <i>▶</i>
        <span>THEM</span>
      </div>
    );
  }
  if (type === 'squeeze') {
    return (
      <div className="mini-art squeeze-art">
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <strong>sending warmth...</strong>
      </div>
    );
  }
  if (type === 'privacy') {
    return (
      <div className="mini-art privacy-art">
        <span>M</span>
        <i>+</i>
        <span>J</span>
        <strong>2 / 2 seats filled</strong>
      </div>
    );
  }
  return (
    <div className="mini-art sound-art">
      {[14, 30, 20, 38, 24, 44, 18, 34, 22, 12].map((height, i) => (
        <i key={i} style={{ height }} />
      ))}
      <strong>rain &nbsp;·&nbsp; fire &nbsp;·&nbsp; vinyl</strong>
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const [squeezed, setSqueezed] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!squeezed) return;
    const timer = window.setTimeout(() => setSqueezed(false), 1800);
    return () => window.clearTimeout(timer);
  }, [squeezed]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modal]);

  const openRoom = (kind: 'create' | 'join') => {
    setCreated(false);
    setCopied(false);
    setNickname('');
    setRoomCode('');
    setRoomName('');
    setErr('');
    setBusy(false);
    setModal(kind);
  };

  const handleSqueezeTest = () => {
    playSqueezeChime();
    setSqueezed(true);
  };

  const submitRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!nickname.trim()) return setErr('Please enter a nickname.');
    setErr('');
    setBusy(true);
    playPopSound();

    try {
      if (modal === 'create') {
        const s = await createRoom(nickname.trim(), roomName.trim());
        saveSession(s);
        setRoomCode(s.code);
        setCreated(true);
        playSqueezeChime();
      } else {
        const c = roomCode.trim().toUpperCase();
        if (!c) {
          setBusy(false);
          return setErr('Please enter the 6-character room code.');
        }
        if (loadSession(c)) {
          playSqueezeChime();
          return nav(`/room/${c}`);
        }
        const s = await joinRoom(c, nickname.trim());
        saveSession(s);
        playSqueezeChime();
        nav(`/room/${s.code}`);
      }
    } catch (x) {
      setErr((x as Error).message);
    }
    setBusy(false);
  };

  const copyInvite = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Page>
      <nav className="nav-shell">
        <Brand />
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#inside">Inside the room</a>
          <a href="#stories">Stories</a>
        </div>
        <div className="nav-actions">
          <button className="join-link" onClick={() => openRoom('join')}>
            Join a room
          </button>
          <Button onClick={() => openRoom('create')}>
            Create a room <ArrowIcon />
          </Button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span>
              <SparkIcon />
            </span>{' '}
            A little room for two
          </div>
          <h1>
            Feel close,
            <br />
            from anywhere.
          </h1>
          <p>
            Share a cozy space to watch, listen, chat, and simply be together—no accounts, no
            noise, just the two of you.
          </p>
          <div className="hero-actions">
            <Button onClick={() => openRoom('create')}>
              Make your room <ArrowIcon />
            </Button>
            <Button variant="light" onClick={() => openRoom('join')}>
              I have a code
            </Button>
          </div>
          <div className="tiny-proof">
            <div className="proof-avatars">
              <span>M</span>
              <span>J</span>
              <span>A</span>
            </div>
            <span>
              Shared by <strong>12,000+ duos</strong>
              <br />
              across 48 countries
            </span>
          </div>
        </div>
        <div className="hero-room-wrap">
          <div className="room-note note-top">Try the lamp!</div>
          <HeroRoom
            theme={themes[0]}
            onSqueeze={handleSqueezeTest}
            squeezed={squeezed}
          />
          <div className="room-note note-bottom">A tiny room, alive for just you two.</div>
        </div>
      </section>

      <section className="trust-strip">
        <span>
          <i>◉</i>No sign-up
        </span>
        <span>
          <i>◇</i>Always just two
        </span>
        <span>
          <i>↯</i>Under 50ms sync
        </span>
        <span>
          <i>⌁</i>Rooms vanish after
        </span>
      </section>

      <section className="intro" id="how">
        <div className="section-kicker">CO-PRESENCE, SIMPLIFIED</div>
        <h2>
          Everything you need to
          <br />
          <em>feel in the same room.</em>
        </h2>
        <p>
          No profiles to perfect. No channels to manage.
          <br />
          Just small, thoughtful details that bring you closer.
        </p>
      </section>

      <section className="feature-grid" id="inside">
        {features.map(feature => (
          <article className={`feature-card feature-${feature.art}`} key={feature.number}>
            <div className="feature-number">{feature.number}</div>
            <div className="feature-copy">
              <span>{feature.eyebrow}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
            <MiniArt type={feature.art} />
          </article>
        ))}
      </section>

      <section className="ritual-section">
        <div className="ritual-copy">
          <div className="section-kicker">YOUR SHARED RITUAL</div>
          <h2>
            One link.
            <br />
            Two seats.
            <br />
            <em>Your place.</em>
          </h2>
          <p>
            Create a temporary room, send the secret code, and settle in. No onboarding maze.
            You can be together in less than a minute.
          </p>
          <div className="steps">
            <div>
              <span>1</span>
              <p>
                <strong>Name your little room</strong>
                <small>Pick a nickname. That's all we need.</small>
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                <strong>Share your secret code</strong>
                <small>Six letters, one trusted person.</small>
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                <strong>Get cozy together</strong>
                <small>Watch, listen, chat, or sit quietly.</small>
              </p>
            </div>
          </div>
          <Button onClick={() => openRoom('create')}>
            Create your room <ArrowIcon />
          </Button>
        </div>
        <div className="ritual-card">
          <div className="invite-window">
            <div className="window-dots">
              <i />
              <i />
              <i />
            </div>
            <div className="invite-icon">
              <span />
              <span />
            </div>
            <span className="invite-label">YOUR PRIVATE ROOM IS READY</span>
            <strong>Sunday evening</strong>
            <p>Invite your favorite person</p>
            <div className="code-box">
              <span>S N U G 4 2</span>
              <button onClick={() => copyInvite('SNUG42')} aria-label="Copy code">
                ▣
              </button>
            </div>
            <button
              className={`copy-link ${copied ? 'copied' : ''}`}
              onClick={() => copyInvite('SNUG42')}
            >
              {copied ? 'Copied to clipboard' : 'Copy invite link'} <ArrowIcon />
            </button>
            <small>Room disappears when you both leave</small>
          </div>
          <div className="paper-note">
            No account.
            <br />
            No history.
            <br />
            <strong>Just this moment.</strong>
          </div>
          <div className="decor-heart">♥</div>
        </div>
      </section>

      <section className="stories" id="stories">
        <div className="section-kicker">NOTES FROM THE COUCH</div>
        <h2>
          Made for the people
          <br />
          <em>you miss the most.</em>
        </h2>
        <div className="story-grid">
          <blockquote>
            <p>
              “We leave the rain sounds on while we both study. It feels like she's at the other
              end of the same table.”
            </p>
            <footer>
              <span className="avatar-badge coral">E</span>
              <span>
                <strong>Elena & Priya</strong>
                <small>London ↔ Toronto</small>
              </span>
            </footer>
          </blockquote>
          <blockquote className="story-featured">
            <div className="quote-mark">“</div>
            <p>
              “Friday night is our COZY night now. We pick a Ghibli movie, make tea, and
              somehow 800 miles feels a lot smaller.”
            </p>
            <footer>
              <span className="avatar-badge plum">L</span>
              <span>
                <strong>Leo & Marc</strong>
                <small>Barcelona ↔ Paris</small>
              </span>
            </footer>
          </blockquote>
          <blockquote>
            <p>
              “The squeeze button is silly in the best possible way. My best friend sends one
              exactly when I need it.”
            </p>
            <footer>
              <span className="avatar-badge gold">N</span>
              <span>
                <strong>Noor & Sami</strong>
                <small>Dubai ↔ Melbourne</small>
              </span>
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="faq-section">
        <div>
          <div className="section-kicker">GOOD TO KNOW</div>
          <h2>
            A few cozy
            <br />
            <em>questions.</em>
          </h2>
          <p>Still wondering something?</p>
          <a href="mailto:hello@cozy.app">hello@cozy.app</a>
        </div>
        <div className="faq-list">
          {faq.map(([question, answer], index) => (
            <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}>
              <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{question}</span>
                <i>{openFaq === index ? '−' : '+'}</i>
              </button>
              <p>{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-stars">✦　·　✧</div>
        <span className="cta-heart">♥</span>
        <h2>
          Your favorite person
          <br />
          is only a room away.
        </h2>
        <p>Free to use. No account needed. Yours in a few seconds.</p>
        <Button variant="light" onClick={() => openRoom('create')}>
          Make a room for two <ArrowIcon />
        </Button>
      </section>

      <footer className="site-footer">
        <Brand />
        <p>
          A softer corner of the internet,
          <br />
          made for two.
        </p>
        <div>
          <a href="#how">How it works</a>
          <a href="#inside">Privacy</a>
          <a href="#stories">Stories</a>
          <a href="mailto:hello@cozy.app">Contact</a>
        </div>
        <span>© 2025 COZY</span>
      </footer>

      {/* Modal for Creating or Joining a Room */}
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <div className="room-modal" onMouseDown={event => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close modal"
            >
              ×
            </button>
            {!created ? (
              <>
                <div className="modal-icon">
                  <span />
                  <span />
                </div>
                <div className="section-kicker">
                  {modal === 'create' ? 'MAKE A ROOM FOR TWO' : 'COME ON IN'}
                </div>
                <h2>{modal === 'create' ? 'Your cozy corner.' : 'Join their room.'}</h2>
                <p>
                  {modal === 'create'
                    ? 'Give us just enough to save your seat.'
                    : 'Enter the code they sent you and pick a name.'}
                </p>
                <form onSubmit={submitRoom}>
                  <label>
                    Your nickname
                    <input
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="e.g. Mia, Alex, Honey"
                      maxLength={18}
                      autoFocus
                      required
                    />
                  </label>
                  {modal === 'join' && (
                    <label>
                      Room code
                      <input
                        className="code-input"
                        value={roomCode}
                        onChange={e =>
                          setRoomCode(
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
                  )}
                  {err && <p className="err">⚠ {err}</p>}
                  <Button type="submit" disabled={busy}>
                    {busy
                      ? 'Opening sanctuary…'
                      : modal === 'create'
                        ? 'Create my room'
                        : 'Take my seat'}{' '}
                    <ArrowIcon />
                  </Button>
                </form>
                <small>No account. No tracking. No awkward setup.</small>
              </>
            ) : (
              <div className="created-state">
                <div className="modal-icon">
                  <span />
                  <span />
                </div>
                <div className="section-kicker">YOUR ROOM IS READY</div>
                <h2>Send them this code.</h2>
                <div className="created-code" aria-live="polite">
                  {roomCode}
                </div>
                <p>
                  Your room is holding two seats. Share this only with your favorite person.
                </p>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <Button onClick={() => copyInvite(roomCode)} variant="light">
                    {copied ? 'Code copied to clipboard!' : 'Copy 6-digit code'}
                  </Button>
                  <Button onClick={() => nav(`/room/${roomCode}`)}>
                    Enter the room <ArrowIcon />
                  </Button>
                </div>
                <button className="text-close" onClick={() => setModal(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
