// Divine Logo Presets as SVG Data URLs for QR code integration

// 1. Peacock Feather (Divine Teal and Gold)
const peacockFeatherSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="featherGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd700" />
      <stop offset="30%" stop-color="#00f2fe" />
      <stop offset="70%" stop-color="#097676" />
      <stop offset="100%" stop-color="#0a0b1e" />
    </radialGradient>
  </defs>
  <circle cx="50%" cy="50%" r="48" fill="#080916" stroke="#ffd700" stroke-width="2"/>
  <path d="M50 85 C35 70, 25 50, 50 15 C75 50, 65 70, 50 85 Z" fill="url(#featherGrad)" />
  <ellipse cx="50" cy="45" rx="12" ry="18" fill="#002d4a" stroke="#ffd700" stroke-width="1.5" />
  <circle cx="50" cy="42" r="7" fill="#ffd700" />
</svg>`;

// 2. Divine Flute (Golden flute with a feather)
const fluteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50%" cy="50%" r="48" fill="#080916" stroke="#ffd700" stroke-width="2"/>
  {/* Flute */}
  <rect x="15" y="47" width="70" height="6" rx="2" fill="linear-gradient(135deg, #ffd700, #b38600)" stroke="#ffd700" stroke-width="0.5"/>
  <circle cx="22" cy="50" r="1.5" fill="#080916"/>
  <circle cx="32" cy="50" r="1.5" fill="#080916"/>
  <circle cx="42" cy="50" r="1.5" fill="#080916"/>
  <circle cx="52" cy="50" r="1.5" fill="#080916"/>
  <circle cx="62" cy="50" r="1.5" fill="#080916"/>
  <circle cx="72" cy="50" r="1.5" fill="#080916"/>
  {/* Peacock feather on flute */}
  <path d="M68 47 C72 38, 78 30, 80 25 C82 30, 78 40, 72 47 Z" fill="#00f2fe" stroke="#ffd700" stroke-width="1"/>
  <circle cx="74" cy="38" r="3" fill="#ffd700"/>
</svg>`;

// 3. Sacred OM Symbol (Golden on dark background)
const omSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50%" cy="50%" r="48" fill="#080916" stroke="#ffd700" stroke-width="2"/>
  <path d="M50 25 C45 25 40 28 40 33 C40 38 48 38 48 44 C48 50 38 52 38 58 C38 65 48 68 55 68 C62 68 68 64 68 58 C68 52 60 50 56 46 C62 44 65 38 65 33 C65 28 58 25 50 25 Z" fill="none" stroke="#ffd700" stroke-width="4" stroke-linecap="round"/>
  <path d="M53 25 C58 20 65 20 68 25" fill="none" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
  <circle cx="68" cy="14" r="2.5" fill="#ffd700"/>
  <path d="M38 42 C30 42 26 48 26 55 C26 62 32 68 38 68" fill="none" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// 4. Krishna Silhouette (Divine profile)
const krishnaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50%" cy="50%" r="48" fill="#080916" stroke="#ffd700" stroke-width="2"/>
  {/* Face Profile and Flute Silhouette */}
  <path d="M42 22 C48 20 54 22 55 27 C56 32 50 36 47 40 C45 42 45 45 48 45 C55 45 68 45 75 45 C77 45 77 48 75 49 C68 49 55 49 48 49 C44 49 42 54 44 58 C46 62 50 65 48 70 C46 75 38 78 35 72 C32 68 35 60 33 55 C31 50 25 48 28 42 C30 38 35 34 38 30 C40 26 40 24 42 22 Z" fill="#ffd700"/>
  <path d="M48 20 C50 15 54 10 58 7 C60 12 55 18 48 20 Z" fill="#00f2fe" stroke="#ffd700" stroke-width="0.5"/>
</svg>`;

const toDataUrl = (svgStr: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

export const logoPresets = {
  none: '',
  peacock: toDataUrl(peacockFeatherSvg),
  flute: toDataUrl(fluteSvg),
  om: toDataUrl(omSvg),
  krishna: toDataUrl(krishnaSvg)
};
