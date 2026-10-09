import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

export const Page = ({ children }: { children: ReactNode }) => (
  <motion.main
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
  >
    {children}
  </motion.main>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'light' | 'soft' | 'ghost';
};

export const Button = ({ variant = 'primary', className = '', ...p }: BtnProps) => (
  <button className={`btn btn-${variant} ${className}`.trim()} {...p} />
);

export function CopyButton({ text, label = 'Copy Code' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea'); t.value = text;
      document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    setDone(true); setTimeout(() => setDone(false), 1800);
  };
  return (
    <Button variant="soft" onClick={copy}>
      <motion.span
        key={done ? 'done' : 'copy'}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        <span aria-live="polite">{done ? 'Copied!' : label}</span>
      </motion.span>
    </Button>
  );
}

export const Toast = ({ text }: { text: string | null }) => (
  <div className="toast-wrap" role="status" aria-live="polite">
    {text && (
      <motion.div
        key={text}
        className="toast"
        initial={{ opacity: 0, y: 14, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
      >
        {text}
      </motion.div>
    )}
  </div>
);
