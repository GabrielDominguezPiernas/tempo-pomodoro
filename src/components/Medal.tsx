/**
 * Componente de medalla con efecto 3D de inclinación
 */

import { useState, useRef, useCallback } from 'react';
import { Tier, TIER_COLORS } from '../lib/achievements';

interface MedalProps {
  emoji: string;
  tier: Tier;
  name: string;
  unlocked: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { medal: 48, emoji: 24 },
  medium: { medal: 64, emoji: 32 },
  large: { medal: 80, emoji: 40 },
};

export function Medal({
  emoji,
  tier,
  name,
  unlocked,
  onClick,
  size = 'medium',
}: MedalProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const medalRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!medalRef.current || !unlocked) return;

    const rect = medalRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calcular ángulo de inclinación basado en posición del mouse
    const maxTilt = 15;
    const x = ((e.clientY - centerY) / (rect.height / 2)) * maxTilt;
    const y = -((e.clientX - centerX) / (rect.width / 2)) * maxTilt;

    setTilt({ x, y });
  }, [unlocked]);

  const handleMouseEnter = () => {
    if (unlocked) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const { medal: medalSize, emoji: emojiSize } = SIZES[size];
  const tierColor = TIER_COLORS[tier];

  return (
    <button
      ref={medalRef}
      type="button"
      className={`medal${unlocked ? '' : ' medal--locked'}${isHovering ? ' medal--hovering' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: medalSize,
        height: medalSize,
        '--tier-color': tierColor,
        transform: unlocked && isHovering
          ? `perspective(300px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.1)`
          : 'perspective(300px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: isHovering
          ? 'transform 0.1s ease-out'
          : 'transform 0.3s ease-out',
      } as React.CSSProperties}
      aria-label={`${name}${unlocked ? '' : ' (bloqueada)'}`}
      disabled={!onClick}
    >
      <div
        className="medal-inner"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: unlocked
            ? `linear-gradient(135deg, ${tierColor}22, ${tierColor}44)`
            : 'var(--color-border)',
          border: `2px solid ${unlocked ? tierColor : 'var(--color-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: unlocked && isHovering
            ? `0 8px 24px ${tierColor}44, inset 0 1px 2px rgba(255,255,255,0.3)`
            : unlocked
            ? `0 2px 8px ${tierColor}22`
            : 'none',
        }}
      >
        <span
          className="medal-emoji"
          style={{
            fontSize: emojiSize,
            filter: unlocked ? 'none' : 'grayscale(1) opacity(0.4)',
            fontFamily: 'var(--font-emoji)',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {emoji}
        </span>
      </div>
      {/* Shine effect */}
      {unlocked && isHovering && (
        <div
          className="medal-shine"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
}

/**
 * Insignia de tier para mostrar junto al nombre
 */
interface TierBadgeProps {
  tier: Tier;
}

const TIER_NAMES: Record<Tier, string> = {
  bronce: 'Bronce',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span
      className="tier-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '0.625rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderRadius: '9999px',
        backgroundColor: `${TIER_COLORS[tier]}22`,
        color: TIER_COLORS[tier],
      }}
    >
      {TIER_NAMES[tier]}
    </span>
  );
}
