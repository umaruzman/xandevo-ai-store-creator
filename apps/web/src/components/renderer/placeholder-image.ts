/**
 * Deterministic offline placeholder image for `{ kind: 'placeholder', seed }`.
 * Returns an inline SVG data URI — no network request, no scripts. A muted
 * duotone wash with a soft light source and a single geometric accent, so a
 * grid of them reads as "product photography pending", not as flat swatches.
 */
export function placeholderImage(seed: string, label: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const alt = (hue + 26) % 360;
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  // Vary the accent placement so adjacent cards differ.
  const cx = 30 + (h % 40);
  const cy = 24 + ((h >> 3) % 30);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 100 100">`,
    `<defs>`,
    `<linearGradient id="bg" x1="0" y1="0" x2="0.65" y2="1">`,
    `<stop offset="0" stop-color="hsl(${hue} 24% 90%)"/>`,
    `<stop offset="1" stop-color="hsl(${alt} 26% 74%)"/>`,
    `</linearGradient>`,
    `<radialGradient id="glow" cx="0.3" cy="0.22" r="0.9">`,
    `<stop offset="0" stop-color="hsl(${hue} 40% 97%)" stop-opacity="0.85"/>`,
    `<stop offset="1" stop-color="hsl(${hue} 40% 97%)" stop-opacity="0"/>`,
    `</radialGradient>`,
    `</defs>`,
    `<rect width="100" height="100" fill="url(#bg)"/>`,
    `<circle cx="${cx}" cy="${cy}" r="26" fill="hsl(${alt} 30% 66%)" opacity="0.45"/>`,
    `<rect width="100" height="100" fill="url(#glow)"/>`,
    `<line x1="0" y1="72" x2="100" y2="66" stroke="hsl(${hue} 24% 40%)" stroke-width="0.4" opacity="0.35"/>`,
    `<text x="8" y="92" font-family="system-ui, sans-serif" font-size="9" font-weight="600" `,
    `letter-spacing="0.5" fill="hsl(${hue} 28% 32%)" opacity="0.8">${escapeXml(initials)}</text>`,
    `</svg>`,
  ].join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}
