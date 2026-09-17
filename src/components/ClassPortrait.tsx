import { getClass } from "../game/classes";
import type { ClassId, Gender } from "../game/classes";
import { cn } from "../utils/cn";

/**
 * Процедурные силуэтные портреты: 6 классов × 2 пола = 12 уникальных образов.
 * Стиль — тёмный силуэт с контровым светом в цвет класса.
 */

interface Props {
  classId: ClassId;
  gender: Gender;
  className?: string;
  glow?: boolean;
}

export function ClassPortrait({ classId, gender, className, glow = true }: Props) {
  const cls = getClass(classId);
  const c = cls.color;
  const a = cls.accent;
  const uid = `${classId}-${gender}`;
  const female = gender === "female";

  return (
    <svg
      viewBox="0 0 200 240"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={`${cls.name} (${female ? "женщина" : "мужчина"})`}
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor={a} stopOpacity="0.42" />
          <stop offset="45%" stopColor={a} stopOpacity="0.12" />
          <stop offset="100%" stopColor="#05070b" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141a26" />
          <stop offset="100%" stopColor="#070a10" />
        </linearGradient>
        <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.85" />
          <stop offset="35%" stopColor={c} stopOpacity="0.15" />
          <stop offset="70%" stopColor={a} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c} stopOpacity="0.7" />
        </linearGradient>
        <filter id={`blur-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {/* фон */}
      <rect width="200" height="240" fill="#05070b" />
      <rect width="200" height="240" fill={`url(#bg-${uid})`} />

      {/* лучи света */}
      <g opacity="0.22" filter={`url(#blur-${uid})`}>
        <path d="M100 -20 L150 240 L50 240 Z" fill={a} opacity="0.35" />
        <ellipse cx="100" cy="96" rx="66" ry="66" fill={a} opacity="0.3" />
      </g>

      {/* оружие за спиной */}
      <g opacity="0.55" stroke={c} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <Weapons classId={classId} accent={a} />
      </g>

      {/* тело */}
      <g>
        <path
          d={
            female
              ? "M42 240 C44 198 62 176 82 168 L118 168 C138 176 156 198 158 240 Z"
              : "M26 240 C28 192 54 166 84 160 L116 160 C146 166 172 192 174 240 Z"
          }
          fill={`url(#body-${uid})`}
          stroke={`url(#rim-${uid})`}
          strokeWidth="2.2"
        />
        {/* шея — сливается с телом */}
        <path
          d={
            female
              ? "M91 146 C91 162 89 170 86 176 L114 176 C111 170 109 162 109 146 Z"
              : "M88 140 C88 158 86 166 82 172 L118 172 C114 166 112 158 112 140 Z"
          }
          fill={`url(#body-${uid})`}
        />
        {/* голова */}
        <ellipse
          cx="100"
          cy={female ? 112 : 108}
          rx={female ? 27 : 30}
          ry={female ? 34 : 36}
          fill="#0c1119"
          stroke={`url(#rim-${uid})`}
          strokeWidth="2"
        />
        {/* волосы */}
        {female ? (
          <path
            d="M70 104 C66 70 82 56 100 56 C118 56 134 70 130 104 C130 92 122 82 112 79 C106 92 94 92 88 79 C78 82 70 92 70 104 Z M70 100 C62 130 60 164 66 190 L80 186 C72 160 72 128 76 108 Z M130 100 C138 130 140 164 134 190 L120 186 C128 160 128 128 124 108 Z"
            fill="#0a0e15"
            stroke={c}
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
        ) : (
          <path
            d="M70 100 C68 70 82 58 100 58 C118 58 132 70 130 100 C126 86 116 78 100 78 C84 78 74 86 70 100 Z"
            fill="#0a0e15"
            stroke={c}
            strokeOpacity="0.4"
            strokeWidth="1.4"
          />
        )}

        {/* классовый головной убор / атрибут */}
        <Headgear classId={classId} female={female} color={c} accent={a} />

        {/* светящиеся глаза */}
        <g filter={`url(#soft-${uid})`}>
          <ellipse cx={female ? 91 : 90} cy={female ? 112 : 110} rx="4.2" ry="2.6" fill={a} />
          <ellipse cx={female ? 109 : 110} cy={female ? 112 : 110} rx="4.2" ry="2.6" fill={a} />
        </g>
        <ellipse cx={female ? 91 : 90} cy={female ? 112 : 110} rx="2" ry="1.2" fill="#fff" opacity="0.85" />
        <ellipse cx={female ? 109 : 110} cy={female ? 112 : 110} rx="2" ry="1.2" fill="#fff" opacity="0.85" />

        {/* намёк на черты лица */}
        <g stroke={c} strokeOpacity="0.3" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d={female ? "M100 116 L98 126 L103 127" : "M100 114 L97 126 L104 127"} />
          <path d={female ? "M93 134 C97 137 103 137 107 134" : "M92 134 C97 138 103 138 108 134"} />
          <path
            d={
              female
                ? "M74 108 C74 134 84 146 100 146 C116 146 126 134 126 108"
                : "M72 106 C72 134 84 144 100 144 C116 144 128 134 128 106"
            }
            strokeOpacity="0.16"
          />
        </g>

        {/* нагрудник / детали брони */}
        <Chest classId={classId} female={female} color={c} accent={a} />
      </g>

      {/* виньетка */}
      <rect width="200" height="240" fill="url(#vig)" />
      <radialGradient id="vig" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.75" />
      </radialGradient>
      {glow && (
        <rect
          width="200"
          height="240"
          fill="none"
          stroke={a}
          strokeOpacity="0.25"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function Weapons({ classId, accent }: { classId: ClassId; accent: string }) {
  switch (classId) {
    case "warrior":
      return (
        <>
          <path d="M64 210 L142 92" />
          <path d="M128 80 L156 100" strokeWidth="5" />
          <path d="M44 150 h30 v22 c0 16 -15 24 -15 24 s-15 -8 -15 -24 z" strokeWidth="2.4" opacity="0.75" />
          <path d="M59 152 V192" strokeWidth="1.6" opacity="0.45" />
        </>
      );
    case "rogue":
      return (
        <>
          <path d="M48 204 L110 96" />
          <path d="M152 204 L90 96" />
          <path d="M44 198 L58 210" />
          <path d="M156 198 L142 210" />
        </>
      );
    case "mage":
      return (
        <>
          <path d="M150 226 L150 60" />
          <circle cx="150" cy="52" r="12" fill={accent} fillOpacity="0.35" />
          <path d="M40 120 l10 -10 M40 140 l14 -14 M46 160 l10 -10" opacity="0.6" />
        </>
      );
    case "paladin":
      return (
        <>
          <path d="M100 30 m-34 0 a34 34 0 1 0 68 0" opacity="0.7" />
          <path d="M54 210 L54 132" />
          <path d="M40 132 H68" />
          <path d="M146 210 L146 150" />
        </>
      );
    case "ranger":
      return (
        <>
          <path d="M150 50 C182 100 182 150 150 200" />
          <path d="M150 50 L150 200" strokeWidth="1.6" />
          <path d="M42 196 L104 108" />
          <path d="M38 200 l0 -14 M38 200 l14 0" />
        </>
      );
    case "berserker":
      return (
        <>
          <path d="M44 206 L104 104" />
          <path d="M156 206 L96 104" />
          <path d="M40 210 a16 16 0 0 1 22 -12" />
          <path d="M160 210 a16 16 0 0 0 -22 -12" />
        </>
      );
  }
}

function Headgear({
  classId,
  female,
  color,
  accent,
}: {
  classId: ClassId;
  female: boolean;
  color: string;
  accent: string;
}) {
  const y = female ? 4 : 0;
  switch (classId) {
    case "warrior":
      return (
        <g transform={`translate(0 ${y})`} fill="#10151f" stroke={color} strokeOpacity="0.6" strokeWidth="1.8">
          <path d="M68 104 C68 68 82 54 100 54 C118 54 132 68 132 104 L124 104 C124 78 114 66 100 66 C86 66 76 78 76 104 Z" />
          <path d="M96 96 H104 V128 H96 Z" />
          <path d="M66 96 L54 88 M134 96 L146 88" strokeWidth="3" />
        </g>
      );
    case "rogue":
      return (
        <g transform={`translate(0 ${y})`} fill="#0a0d14" stroke={color} strokeOpacity="0.5" strokeWidth="1.6">
          <path d="M62 132 C56 78 78 46 100 46 C122 46 144 78 138 132 C136 108 128 90 118 84 C110 100 90 100 82 84 C72 90 64 108 62 132 Z" />
          <path d="M62 128 L54 178 L78 168 M138 128 L146 178 L122 168" fill="#0a0d14" />
        </g>
      );
    case "mage":
      return (
        <g transform={`translate(0 ${y})`} fill="#0b1020" stroke={color} strokeOpacity="0.55" strokeWidth="1.6">
          <path d="M100 18 C112 40 122 62 126 84 L74 84 C78 62 88 40 100 18 Z" />
          <path d="M56 86 C70 78 130 78 144 86 C130 96 70 96 56 86 Z" />
          <circle cx="100" cy="70" r="4" fill={accent} stroke="none" />
        </g>
      );
    case "paladin":
      return (
        <g transform={`translate(0 ${y})`} fill="#141013" stroke={color} strokeOpacity="0.65" strokeWidth="1.8">
          <path d="M70 100 C70 66 84 52 100 52 C116 52 130 66 130 100 L120 100 C120 76 112 64 100 64 C88 64 80 76 80 100 Z" />
          <path d="M74 56 L70 40 L84 50 L92 34 L100 50 L108 34 L116 50 L130 40 L126 56 Z" fill={accent} fillOpacity="0.5" />
          <path d="M96 92 H104 V124 H96 Z" />
        </g>
      );
    case "ranger":
      return (
        <g transform={`translate(0 ${y})`} fill="#0a1310" stroke={color} strokeOpacity="0.5" strokeWidth="1.6">
          <path d="M64 126 C60 80 80 50 100 50 C120 50 140 80 136 126 C132 104 124 88 114 82 C108 96 92 96 86 82 C76 88 68 104 64 126 Z" />
          <path d="M132 66 C146 54 158 50 166 52 C158 62 146 70 134 74 Z" fill={accent} fillOpacity="0.45" />
        </g>
      );
    case "berserker":
      return (
        <g transform={`translate(0 ${y})`} fill="#140d0d" stroke={color} strokeOpacity="0.55" strokeWidth="1.8">
          {/* витые рога, растущие из висков */}
          <path d="M76 88 C60 86 46 76 40 60 C50 64 57 60 57 50 C65 61 72 76 79 85 Z" />
          <path d="M124 88 C140 86 154 76 160 60 C150 64 143 60 143 50 C135 61 128 76 121 85 Z" />
          <path d="M72 94 C74 74 84 62 100 62 C116 62 126 74 128 94 L118 94 C116 80 110 72 100 72 C90 72 84 80 82 94 Z" />
          <path d="M66 152 C80 142 120 142 134 152 C120 166 80 166 66 152 Z" fill="#191113" />
        </g>
      );
  }
}

function Chest({
  classId,
  female,
  color,
  accent,
}: {
  classId: ClassId;
  female: boolean;
  color: string;
  accent: string;
}) {
  const top = female ? 186 : 180;
  return (
    <g stroke={color} strokeOpacity="0.45" strokeWidth="1.6" fill="none">
      {classId === "warrior" && (
        <>
          <path d={`M72 ${top} L100 ${top + 16} L128 ${top}`} />
          <circle cx="56" cy={top + 14} r="12" />
          <circle cx="144" cy={top + 14} r="12" />
        </>
      )}
      {classId === "rogue" && (
        <>
          <path d={`M78 ${top - 2} L100 ${top + 26} L122 ${top - 2}`} />
          <path d={`M66 ${top + 22} H134`} strokeOpacity="0.3" />
        </>
      )}
      {classId === "mage" && (
        <>
          <path d={`M82 ${top} L100 ${top + 30} L118 ${top}`} />
          <circle cx="100" cy={top + 10} r="5" fill={accent} fillOpacity="0.6" stroke="none" />
        </>
      )}
      {classId === "paladin" && (
        <>
          <path d={`M100 ${top - 4} V ${top + 40}`} />
          <path d={`M84 ${top + 10} H116`} />
          <circle cx="100" cy={top + 6} r="16" strokeOpacity="0.3" />
        </>
      )}
      {classId === "ranger" && (
        <>
          <path d={`M70 ${top + 4} L128 ${top + 30}`} />
          <path d={`M78 ${top + 28} L118 ${top - 2}`} strokeOpacity="0.3" />
        </>
      )}
      {classId === "berserker" && (
        <>
          <path d={`M74 ${top} C88 ${top + 14} 112 ${top + 14} 126 ${top}`} />
          <path d={`M84 ${top + 18} L92 ${top + 34} M116 ${top + 18} L108 ${top + 34}`} strokeOpacity="0.35" />
        </>
      )}
    </g>
  );
}
