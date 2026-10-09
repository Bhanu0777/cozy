export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'loved', emoji: '🥰', label: 'Feeling loved' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { id: 'missing', emoji: '😭', label: 'Missing you' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming' },
  { id: 'studying', emoji: '📚', label: 'Studying' },
  { id: 'chilling', emoji: '☕', label: 'Chilling' },
  { id: 'excited', emoji: '🤩', label: 'Excited' },
] as const;
export const moodOf = (id: string) => MOODS.find(m => m.id === id) ?? MOODS[0];
