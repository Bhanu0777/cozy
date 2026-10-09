import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Smile } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { playPopSound } from '../../utils/sound';

type Props = {
  messages: ChatMessage[];
  me: string;
  typingName: string | null;
  onSend: (t: string) => Promise<{ ok: boolean; error?: string }>;
  onTyping: (v: boolean) => void;
};

const QUICK_REACTIONS = ['❤️', '🥺', '🫂', '😂', '✨', '☕', '🌸', '💖'];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function Chat({ messages, me, typingName, onSend, onTyping }: Props) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const typing = useRef(false);
  const timer = useRef<number>();
  const prevMsgCount = useRef(messages.length);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (messages.length > prevMsgCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== me) {
        playPopSound();
      }
      prevMsgCount.current = messages.length;
    }
  }, [messages, typingName, me]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const change = (v: string) => {
    setText(v);
    if (!typing.current && v) {
      typing.current = true;
      onTyping(true);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      typing.current = false;
      onTyping(false);
    }, 1500);
  };

  const submit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const t = text.trim();
    if (!t) return;
    window.clearTimeout(timer.current);
    typing.current = false;
    onTyping(false);
    setText('');
    setErr('');
    playPopSound();
    const r = await onSend(t);
    if (!r.ok) {
      setErr(r.error ?? 'Message not sent.');
      setText(t);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    playPopSound();
    await onSend(emoji);
    setShowReactions(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="chat" aria-label="Snug Chat">
      <div className="chat-header">
        <div className="chat-header-title">
          <MessageCircle size={18} aria-hidden />
          <span>Snug Chat</span>
        </div>
        <div className="chat-header-actions">
          <button
            type="button"
            className={`reaction-toggle-btn ${showReactions ? 'active' : ''}`}
            onClick={() => setShowReactions(!showReactions)}
            title="Quick Reactions"
            aria-label="Quick Reactions"
          >
            <Smile size={16} aria-hidden />
          </button>
          {messages.length > 0 && (
            <span className="msg-counter">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          )}
        </div>
      </div>

      {/* Quick reaction floating drawer */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            className="quick-reactions-bar"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {QUICK_REACTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="quick-reaction-btn"
                onClick={() => handleQuickReaction(emoji)}
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-log" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="empty-chat">
            <div className="empty-chat-icon">✨</div>
            <h4>Your private conversation</h4>
            <p>Say hello, send a cozy emoji, or drop a sweet note.</p>
          </div>
        )}

        {messages.map(m => {
          const isMine = m.senderId === me;
          return (
            <motion.div
              key={m.id}
              className={`msg ${isMine ? 'mine' : ''}`}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <span className="who">
                {isMine ? 'You' : m.sender} · {formatTime(m.at)}
              </span>
              <p>{m.text}</p>
            </motion.div>
          );
        })}

        <div
          className="typing"
          aria-live="polite"
          style={{ opacity: typingName ? 1 : 0, transition: 'opacity .2s ease' }}
        >
          {typingName && (
            <div className="typing-indicator">
              <span className="typing-dots">
                <i />
                <i />
                <i />
              </span>
              <span>{typingName} is typing…</span>
            </div>
          )}
        </div>
        <div ref={end} />
      </div>

      {err && (
        <p className="err" role="alert" style={{ margin: '6px 0 0' }}>
          ⚠ {err}
        </p>
      )}

      <form className="chat-form" onSubmit={submit}>
        <div className="chat-input-wrapper">
          <input
            value={text}
            onChange={e => change(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            maxLength={500}
            aria-label="Message"
            autoComplete="off"
          />
        </div>
        <button
          className="send-btn"
          aria-label="Send message"
          disabled={!text.trim()}
          type="submit"
        >
          <Send size={16} aria-hidden />
        </button>
      </form>
    </section>
  );
}
