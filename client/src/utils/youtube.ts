const ID_RE = /^[\w-]{11}$/;
// Mirrors the server-side parser. The server re-validates everything.
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;
  if (ID_RE.test(raw)) return raw;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else id = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?]+)/)?.[2] ?? null;
  }
  return id && ID_RE.test(id) ? id : null;
}
