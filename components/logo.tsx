export function InfiniteLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 sm:w-12 sm:h-12">
        <defs>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#0ea5e9", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#0369a1", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="jewelGrad1" cx="35%" cy="35%">
            <stop offset="0%" style={{ stopColor: "#60a5fa", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#1e40af", stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id="jewelGrad2" cx="35%" cy="35%">
            <stop offset="0%" style={{ stopColor: "#06b6d4", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#0c4a6e", stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        {/* Crown band shadow */}
        <rect x="20" y="130" width="160" height="50" rx="8" fill="#000" opacity="0.3" />

        {/* Main crown band with enhanced gradient */}
        <rect x="20" y="125" width="160" height="50" rx="8" fill="url(#crownGrad)" stroke="#fbbf24" strokeWidth="2.5" />

        {/* Crown arch with shimmer */}
        <path
          d="M 25 125 Q 25 95 50 85 L 70 50 L 100 75 L 130 50 L 150 85 Q 175 95 175 125"
          fill="none"
          stroke="#fcd34d"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Crown points - main spires with enhanced size */}
        <g>
          {/* Left point */}
          <circle cx="70" cy="50" r="16" fill="#fbbf24" opacity="1" />
          <circle cx="70" cy="50" r="12" fill="#fcd34d" />
          <circle cx="68" cy="48" r="4" fill="#fef3c7" opacity="0.8" />

          {/* Center point - largest */}
          <circle cx="100" cy="75" r="20" fill="#fbbf24" />
          <circle cx="100" cy="75" r="15" fill="#fcd34d" />
          <circle cx="98" cy="72" r="5" fill="#fef3c7" opacity="0.9" />

          {/* Right point */}
          <circle cx="130" cy="50" r="16" fill="#fbbf24" opacity="1" />
          <circle cx="130" cy="50" r="12" fill="#fcd34d" />
          <circle cx="132" cy="48" r="4" fill="#fef3c7" opacity="0.8" />
        </g>

        {/* Enhanced blue jewels with radial gradient shine */}
        <g>
          <circle cx="70" cy="50" r="6" fill="url(#jewelGrad1)" opacity="0.95" />
          <circle cx="70" cy="50" r="3.5" fill="#93c5fd" />

          <circle cx="100" cy="75" r="8" fill="url(#jewelGrad2)" opacity="1" />
          <circle cx="100" cy="75" r="4.5" fill="#22d3ee" />

          <circle cx="130" cy="50" r="6" fill="url(#jewelGrad1)" opacity="0.95" />
          <circle cx="130" cy="50" r="3.5" fill="#93c5fd" />
        </g>

        {/* Cross accent on band */}
        <path d="M 100 125 L 100 150" stroke="#fcd34d" strokeWidth="2" opacity="0.7" />

        {/* Subtle shine lines */}
        <line x1="25" y1="135" x2="175" y2="135" stroke="#fef3c7" strokeWidth="1" opacity="0.3" />
      </svg>
      <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
        Infinite
      </span>
    </div>
  )
}
