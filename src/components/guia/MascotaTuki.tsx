import { motion, useReducedMotion } from 'framer-motion';

/** Tuki, el robot asistente de las guías paso a paso (compra, venta y alta de productos). */
export default function MascotaTuki({ feliz, compact = false }: { feliz: boolean; compact?: boolean }) {
  const reducirMovimiento = useReducedMotion();
  const movimiento = !reducirMovimiento;

  return (
    <motion.div
      initial={movimiento ? { opacity: 0, scale: 0.75, y: 12 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative mx-auto flex shrink-0 items-center justify-center ${compact ? 'h-10 w-10' : 'h-28 w-28 sm:h-32 sm:w-32'}`}
      aria-label="Robot asistente animado"
      role="img"
    >
      <motion.div
        className="absolute inset-3 rounded-full bg-cyan-300/20 blur-xl"
        animate={movimiento ? { scale: [0.85, 1.15, 0.85], opacity: [0.45, 0.8, 0.45] } : { opacity: 0.5 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.svg
        viewBox="0 0 128 128"
        className="relative z-10 h-full w-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]"
        animate={movimiento ? { y: [0, -5, 0], rotate: [-2, 2, -2] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="guiaRobotHead" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ecfeff" /><stop offset="1" stopColor="#a5f3fc" /></linearGradient>
          <linearGradient id="guiaRobotBody" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399" /><stop offset="1" stopColor="#0891b2" /></linearGradient>
        </defs>
        <ellipse cx="64" cy="116" rx="34" ry="6" fill="#020617" opacity=".35" />
        <motion.g animate={movimiento ? { rotate: [0, -15, 0, 12, 0] } : undefined} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }} style={{ transformOrigin: '96px 69px' }}>
          <path d="M91 78 Q108 83 111 66" fill="none" stroke="#a5f3fc" strokeWidth="9" strokeLinecap="round" />
          <circle cx="111" cy="63" r="8" fill="#fef08a" stroke="#fff7c2" strokeWidth="3" />
        </motion.g>
        <path d="M37 91 Q37 83 46 82 H82 Q91 83 91 91 V108 H37Z" fill="url(#guiaRobotBody)" stroke="#99f6e4" strokeWidth="3" />
        <rect x="52" y="91" width="24" height="12" rx="6" fill="#083344" opacity=".8" />
        <motion.circle cx="64" cy="97" r="3" fill="#bef264" animate={movimiento ? { opacity: [.35, 1, .35], scale: [.85, 1.2, .85] } : undefined} transition={{ duration: 1.8, repeat: Infinity }} />
        <path d="M48 106 L44 113 M80 106 L84 113" stroke="#a5f3fc" strokeWidth="7" strokeLinecap="round" />
        <path d="M64 26 V17" stroke="#a5f3fc" strokeWidth="5" strokeLinecap="round" />
        <motion.circle cx="64" cy="13" r="6" fill="#f9a8d4" animate={movimiento ? { scale: [1, 1.3, 1], opacity: [.65, 1, .65] } : undefined} transition={{ duration: 1.4, repeat: Infinity }} />
        <rect x="25" y="27" width="78" height="59" rx="22" fill="url(#guiaRobotHead)" stroke="#cffafe" strokeWidth="3" />
        <rect x="32" y="34" width="64" height="44" rx="16" fill="#082f49" />
        <motion.g animate={movimiento ? { scaleY: [1, 1, 0.12, 1, 1] } : undefined} transition={{ duration: 4, repeat: Infinity, times: [0, .42, .46, .5, 1], ease: 'easeInOut' }} style={{ transformOrigin: '64px 53px' }}>
          <ellipse cx="49" cy="52" rx="5.5" ry="7" fill="#67e8f9" />
          <ellipse cx="79" cy="52" rx="5.5" ry="7" fill="#67e8f9" />
          <circle cx="47" cy="49" r="1.8" fill="white" />
          <circle cx="77" cy="49" r="1.8" fill="white" />
        </motion.g>
        <circle cx="40" cy="64" r="4" fill="#fb7185" opacity=".7" />
        <circle cx="88" cy="64" r="4" fill="#fb7185" opacity=".7" />
        <motion.path d={feliz ? 'M54 63 Q64 74 74 63' : 'M57 64 Q64 69 71 64'} fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" animate={movimiento ? { scaleY: [1, 1.12, 1] } : undefined} transition={{ duration: 1.1, repeat: Infinity, repeatType: 'mirror' }} style={{ transformOrigin: '64px 68px' }} />
        <circle cx="20" cy="46" r="2" fill="#fef08a" opacity=".9" />
        <circle cx="108" cy="38" r="2.5" fill="#67e8f9" opacity=".9" />
      </motion.svg>
    </motion.div>
  );
}
