/** Иллюстрация храма для карточки в городе (чистый SVG вместо фото) */
export function ChurchMark() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full transition duration-700 group-hover:scale-110"
      aria-hidden
    >
      <defs>
        <radialGradient id="cm-sky" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#3a2f55" />
          <stop offset="55%" stopColor="#151426" />
          <stop offset="100%" stopColor="#07090d" />
        </radialGradient>
        <linearGradient id="cm-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d78a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#d9a441" stopOpacity="0.15" />
        </linearGradient>
        <filter id="cm-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="400" height="220" fill="url(#cm-sky)" />

      {/* луна и звёзды */}
      <circle cx="326" cy="46" r="20" fill="#e8e3d5" opacity="0.22" filter="url(#cm-blur)" />
      <circle cx="326" cy="46" r="13" fill="#e8e3d5" opacity="0.5" />
      {[
        [40, 30],
        [92, 58],
        [150, 26],
        [232, 44],
        [286, 76],
        [366, 96],
        [66, 92],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#fff" opacity="0.5" />
      ))}

      {/* силуэт храма */}
      <g fill="#0d1018" stroke="#2c3650" strokeWidth="2">
        {/* боковые крылья */}
        <path d="M60 220 V150 h70 v70 Z" />
        <path d="M270 220 V150 h70 v70 Z" />
        {/* неф */}
        <path d="M130 220 V118 h140 v102 Z" />
        {/* фронтон */}
        <path d="M124 120 L200 62 L276 120 Z" />
        {/* колокольня */}
        <path d="M176 62 V16 h48 v46 Z" />
        <path d="M170 18 L200 -6 L230 18 Z" />
      </g>

      {/* крест на шпиле */}
      <g stroke="#f4d78a" strokeWidth="3.5" strokeLinecap="round" opacity="0.9">
        <path d="M200 -22 V4" />
        <path d="M190 -12 H210" />
      </g>

      {/* витражное окно-розетка */}
      <g transform="translate(200 132)">
        <circle r="30" fill="url(#cm-glow)" opacity="0.5" filter="url(#cm-blur)" />
        <circle r="22" fill="#f4d78a" fillOpacity="0.28" stroke="#2c3650" strokeWidth="2.5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1="0"
              y1="0"
              x2={Math.cos(a) * 22}
              y2={Math.sin(a) * 22}
              stroke="#2c3650"
              strokeWidth="2"
            />
          );
        })}
      </g>

      {/* арочные окна с тёплым светом */}
      {[86, 112, 296, 322].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 8} 210 V178 a8 8 0 0 1 16 0 V210 Z`}
            fill="#f4d78a"
            fillOpacity="0.35"
            stroke="#2c3650"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* врата */}
      <path
        d="M184 220 V168 a16 16 0 0 1 32 0 V220 Z"
        fill="#f4d78a"
        fillOpacity="0.5"
        stroke="#2c3650"
        strokeWidth="2"
      />
      <ellipse cx="200" cy="220" rx="70" ry="16" fill="#f4d78a" opacity="0.14" filter="url(#cm-blur)" />
    </svg>
  );
}
