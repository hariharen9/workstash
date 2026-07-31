import React, { useEffect, useRef, forwardRef, type ReactNode } from 'react';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
  as?: React.ElementType;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

// Global tracker to avoid 30+ event listeners
let isPointerTracking = false;
let pointerListenerCount = 0;

const setupGlobalPointerTracking = () => {
  if (isPointerTracking) return;
  isPointerTracking = true;
  
  const syncPointer = (e: PointerEvent) => {
    const { clientX: x, clientY: y } = e;
    document.documentElement.style.setProperty('--x', x.toFixed(2));
    document.documentElement.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
    document.documentElement.style.setProperty('--y', y.toFixed(2));
    document.documentElement.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
  };
  
  document.addEventListener('pointermove', syncPointer);
};

export const GlowCard = forwardRef<any, GlowCardProps>(({ 
  children, 
  className = '', 
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false,
  style,
  as: Component = 'div',
  ...rest
}, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pointerListenerCount++;
    setupGlobalPointerTracking();
    return () => {
      pointerListenerCount--;
      if (pointerListenerCount === 0) {
        // Optional: remove listener if 0
      }
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor] || glowColorMap.blue;

  const getSizeClasses = () => {
    if (customSize) return '';
    return sizeMap[size] || sizeMap.md;
  };

  const getInlineStyles = () => {
    const baseStyles: React.CSSProperties = {
      '--base': base,
      '--spread': spread,
      '--radius': '16',
      '--border': '1',
      '--backdrop': 'rgba(10, 14, 22, 0.55)',
      '--backup-border': 'rgba(42, 51, 72, 0.85)',
      '--size': '220',
      '--outer': '0.7',
      '--border-size': 'calc(var(--border, 1) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.04)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative' as const,
      touchAction: 'none' as const,
      ...style, // Merge passed styles (important for dnd-kit grid positioning)
    } as React.CSSProperties;

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  return (
    <Component
      ref={ref}
      data-glow
      style={getInlineStyles()}
      className={`
        ${getSizeClasses()}
        ${className.includes('rounded') ? '' : 'rounded-2xl'}
        relative 
        shadow-[0_1rem_2rem_-1rem_black] 
        backdrop-blur-[5px]
        ${className}
      `}
      {...rest}
    >
      <div ref={innerRef} data-glow></div>
      {children}
    </Component>
  );
});

GlowCard.displayName = 'GlowCard';
