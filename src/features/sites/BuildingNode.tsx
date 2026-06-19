import React from "react";

// 점검 상태별 색
export const STATUS_COLOR: Record<string, string> = {
  ok: "#34d399", soon: "#fbbf24", late: "#f87171",
};

// 건물 종류 목록 (사이트 등록 드롭다운에서 사용)
export const BUILDING_TYPES: { key: string; label: string }[] = [
  { key: "university", label: "대학교" },
  { key: "research", label: "연구원/공단" },
  { key: "hospital", label: "병원" },
  { key: "govoffice", label: "관공서/시청" },
  { key: "public", label: "공공기관" },
  { key: "tower", label: "고층빌딩" },
  { key: "datacenter", label: "데이터센터" },
  { key: "factory", label: "공장/창고" },
  { key: "forest", label: "산림/연구단지" },
  { key: "office", label: "일반/기타" },
];

// 색을 어둡게 (면 음영용)
const dark = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.round(r * amt)); g = Math.max(0, Math.round(g * amt)); b = Math.max(0, Math.round(b * amt));
  return `rgb(${r},${g},${b})`;
};

// 종류별 건물 SVG (색 c를 받아 상태색 적용)
const SHAPES: Record<string, (c: string) => React.ReactNode> = {
  university: (c) => (<>
    <polygon points="58,52 98,72 98,90 58,104 18,90 18,72" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="18,72 58,52 98,72 58,86" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,86 98,72 98,90 58,104" fill={dark(c,0.12)} stroke={c} strokeWidth="1.3"/>
    <rect x="48" y="30" width="20" height="22" fill={dark(c,0.3)} stroke={c} strokeWidth="1.2"/>
    <path d="M48 30 Q58 14 68 30 Z" fill={dark(c,0.4)} stroke={c} strokeWidth="1.2"/>
    <line x1="58" y1="14" x2="58" y2="8" stroke={c} strokeWidth="1.3"/><circle cx="58" cy="7" r="1.6" fill={c}/>
    <g stroke={c} strokeWidth="1.6" opacity="0.7"><line x1="30" y1="76" x2="30" y2="88"/><line x1="40" y1="80" x2="40" y2="92"/><line x1="76" y1="80" x2="76" y2="92"/><line x1="86" y1="76" x2="86" y2="88"/></g>
    <g fill={c}><rect x="52" y="40" width="4" height="5"/><rect x="60" y="40" width="4" height="5"/></g>
  </>),
  research: (c) => (<>
    <polygon points="58,40 96,58 96,86 58,104 20,86 20,58" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,40 96,58 58,76 20,58" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="20,58 58,76 58,104 20,86" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="96,58 58,76 58,104 96,86" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <g stroke={c} strokeWidth="0.8" opacity="0.5"><line x1="30" y1="64" x2="30" y2="92"/><line x1="38" y1="68" x2="38" y2="96"/><line x1="46" y1="72" x2="46" y2="100"/></g>
    <rect x="48" y="26" width="20" height="10" rx="1.5" fill={dark(c,0.3)} stroke={c} strokeWidth="1.2"/>
    <circle cx="58" cy="31" r="2.5" fill={c} opacity="0.7"/>
    <g fill={c}><rect x="64" y="66" width="4" height="5"/><rect x="72" y="70" width="4" height="5"/><rect x="80" y="74" width="4" height="5"/></g>
  </>),
  hospital: (c) => (<>
    <polygon points="58,34 92,52 92,84 58,102 24,84 24,52" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,34 92,52 58,70 24,52" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="24,52 58,70 58,102 24,84" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="92,52 58,70 58,102 92,84" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <ellipse cx="58" cy="50" rx="8" ry="4" fill={dark(c,0.3)} stroke={c} strokeWidth="1"/>
    <text x="58" y="53" fontSize="6" fill={c} textAnchor="middle" fontWeight="bold">H</text>
    <g fill={c}><rect x="53" y="74" width="10" height="22" rx="1"/><rect x="46" y="81" width="24" height="9" rx="1"/></g>
  </>),
  govoffice: (c) => (<>
    <polygon points="58,52 96,70 96,88 58,104 20,88 20,70" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="20,70 58,52 96,70 58,86" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,86 96,70 96,88 58,104" fill={dark(c,0.12)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,22 90,40 58,52 26,40" fill={dark(c,0.36)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,22 58,52 26,40" fill={dark(c,0.26)} stroke={c} strokeWidth="1"/>
    <line x1="42" y1="30" x2="42" y2="14" stroke={c} strokeWidth="1.2"/><rect x="42" y="14" width="7" height="5" fill={c} opacity="0.6"/>
    <g stroke={c} strokeWidth="1.8" opacity="0.75"><line x1="32" y1="74" x2="32" y2="88"/><line x1="44" y1="78" x2="44" y2="92"/><line x1="72" y1="78" x2="72" y2="92"/><line x1="84" y1="74" x2="84" y2="88"/></g>
  </>),
  public: (c) => (<>
    <polygon points="58,40 94,58 94,86 58,104 22,86 22,58" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,40 94,58 58,76 22,58" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="22,58 58,76 58,104 22,86" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="94,58 58,76 58,104 94,86" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <path d="M30 60 Q58 46 86 60" fill="none" stroke={c} strokeWidth="1.5" opacity="0.8"/>
    <ellipse cx="58" cy="38" rx="10" ry="4" fill={dark(c,0.3)} stroke={c} strokeWidth="1.2"/>
    <g fill={c}><rect x="34" y="64" width="4" height="5"/><rect x="42" y="68" width="4" height="5"/><rect x="74" y="68" width="4" height="5"/><rect x="82" y="64" width="4" height="5"/></g>
  </>),
  tower: (c) => (<>
    <polygon points="58,12 80,24 80,90 58,102 36,90 36,24" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,12 80,24 58,36 36,24" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="36,24 58,36 58,102 36,90" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="80,24 58,36 58,102 80,90" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <line x1="58" y1="12" x2="58" y2="4" stroke={c} strokeWidth="1.2"/><circle cx="58" cy="3" r="1.6" fill={c}/>
    <g fill={c}><rect x="41" y="40" width="4" height="4"/><rect x="48" y="44" width="4" height="4"/><rect x="41" y="50" width="4" height="4"/><rect x="48" y="54" width="4" height="4"/><rect x="41" y="60" width="4" height="4"/><rect x="48" y="64" width="4" height="4"/><rect x="41" y="70" width="4" height="4"/></g>
  </>),
  datacenter: (c) => (<>
    <polygon points="58,40 90,56 90,86 58,102 26,86 26,56" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,40 90,56 58,72 26,56" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="26,56 58,72 58,102 26,86" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="90,56 58,72 58,102 90,86" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <line x1="46" y1="50" x2="46" y2="16" stroke={c} strokeWidth="1.5"/><circle cx="46" cy="14" r="2.5" fill={c}/>
    <path d="M46 22 q8 0 10 8" fill="none" stroke={c} strokeWidth="1" opacity="0.6"/>
    <ellipse cx="70" cy="44" rx="8" ry="4" fill="none" stroke={c} strokeWidth="1.3" transform="rotate(-25 70 44)"/>
    <g fill={c}><rect x="36" y="62" width="5" height="4"/><rect x="44" y="66" width="5" height="4"/></g>
  </>),
  factory: (c) => (<>
    <polygon points="58,54 92,70 92,88 58,104 24,88 24,70" fill={dark(c,0.2)} stroke={c} strokeWidth="1.3"/>
    <path d="M24 70 L36 58 L40 66 L52 54 L56 62 L68 50 L72 58 L84 48 L92 70 Z" fill={dark(c,0.3)} stroke={c} strokeWidth="1.2"/>
    <rect x="74" y="24" width="8" height="26" fill={dark(c,0.3)} stroke={c} strokeWidth="1.2"/>
    <ellipse cx="78" cy="22" rx="5" ry="2" fill={c} opacity="0.4"/>
    <g fill={c}><rect x="34" y="76" width="6" height="6"/><rect x="48" y="76" width="6" height="6"/><rect x="62" y="76" width="6" height="6"/></g>
  </>),
  forest: (c) => (<>
    <polygon points="54,58 86,74 86,90 54,104 22,90 22,74" fill={dark(c,0.2)} stroke={c} strokeWidth="1.3"/>
    <polygon points="22,74 54,58 86,74 54,88" fill={dark(c,0.32)} stroke={c} strokeWidth="1.3"/>
    <polygon points="54,88 86,74 86,90 54,104" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <g><line x1="74" y1="56" x2="74" y2="44" stroke={c} strokeWidth="1.5"/><circle cx="74" cy="40" r="7" fill={dark(c,0.32)} stroke={c} strokeWidth="1.2"/></g>
    <g><line x1="40" y1="60" x2="40" y2="50" stroke={c} strokeWidth="1.3"/><circle cx="40" cy="46" r="5.5" fill={dark(c,0.32)} stroke={c} strokeWidth="1.1"/></g>
    <g fill={c}><rect x="48" y="74" width="5" height="5"/><rect x="58" y="76" width="5" height="5"/></g>
  </>),
  office: (c) => (<>
    <polygon points="58,46 86,60 86,86 58,100 30,86 30,60" fill={dark(c,0.18)} stroke={c} strokeWidth="1.3"/>
    <polygon points="58,46 86,60 58,74 30,60" fill={dark(c,0.3)} stroke={c} strokeWidth="1.3"/>
    <polygon points="30,60 58,74 58,100 30,86" fill={dark(c,0.22)} stroke={c} strokeWidth="1.3"/>
    <polygon points="86,60 58,74 58,100 86,86" fill={dark(c,0.14)} stroke={c} strokeWidth="1.3"/>
    <g fill={c}><rect x="38" y="66" width="5" height="4"/><rect x="46" y="70" width="5" height="4"/></g>
  </>),
};

export const BuildingNode: React.FC<{ type?: string | null; status?: string; blink?: boolean }> = ({ type, status = "ok", blink }) => {
  const c = STATUS_COLOR[status] || STATUS_COLOR.ok;
  const shape = SHAPES[type || "office"] || SHAPES.office;
  return (
    <svg width="116" height="110" viewBox="0 0 116 110" style={{ filter: `drop-shadow(0 8px 14px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${c}55)`, animation: blink ? "bldgblink 1.6s infinite" : undefined }}>
      {shape(c)}
    </svg>
  );
};
