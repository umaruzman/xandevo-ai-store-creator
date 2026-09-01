/**
 * Deterministic offline placeholder image for `{ kind: 'placeholder', seed }`.
 * Returns an inline SVG data URI — no network request, no scripts.
 */
export function placeholderImage(seed: string, label: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="hsl(${hue} 55% 82%)"/>`,
    `<stop offset="1" stop-color="hsl(${(hue + 40) % 360} 55% 68%)"/>`,
    `</linearGradient></defs>`,
    `<rect width="400" height="400" fill="url(#g)"/>`,
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" `,
    `font-family="system-ui, sans-serif" font-size="120" font-weight="600" fill="hsl(${hue} 40% 30%)">`,
    `${escapeXml(initials)}</text></svg>`,
  ].join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}
