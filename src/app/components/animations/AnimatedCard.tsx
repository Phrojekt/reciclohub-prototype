"use client"

import { useRef, useEffect, useState, ReactNode } from 'react';
import { useIsMobile, useReducedMotion } from './hooks';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  index?: number;
}

export default function AnimatedCard({ 
  children, 
  delay = 0, 
  className = "",
  index = 0
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const { isMobile, isTablet } = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Fallback: se não carregar em 3 segundos, força a animação
    const fallbackTimer = setTimeout(() => {
      if (!hasTriggered) {
        setIsVisible(true);
        setHasTriggered(true);
      }
    }, 3000);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          
          // Delays mais consistentes e menores
          const baseDelay = Math.max(0, delay);
          const indexDelay = index * 100; // 100ms entre cada item
          const totalDelay = isMobile ? 
            Math.min(baseDelay + indexDelay, 500) : // Max 500ms no mobile
            Math.min(baseDelay + indexDelay, 800);   // Max 800ms no desktop
          
          setTimeout(() => {
            setIsVisible(true);
          }, totalDelay);
          
          observer.unobserve(entry.target);
        }
      },
      {
        // Viewport mais generoso para carregar antes
        rootMargin: "100px 0px 100px 0px",
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [delay, index, isMobile, isTablet, hasTriggered]);

  // Movimento reduzido - apenas fade
  if (prefersReducedMotion) {
    return (
      <div
        ref={ref}
        className={`${className} transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : `opacity-0 translate-y-6 scale-98`
      }`}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
