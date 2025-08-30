'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}

// Motion configuration
export const motionConfig = {
  // Smooth scroll animations
  scrollAnimations: {
    fadeInUp: {
      initial: { opacity: 0, y: 60 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: 'easeOut' },
      viewport: { once: true, margin: '-100px' }
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -60 },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: 0.8, ease: 'easeOut' },
      viewport: { once: true, margin: '-100px' }
    },
    fadeInRight: {
      initial: { opacity: 0, x: 60 },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: 0.8, ease: 'easeOut' },
      viewport: { once: true, margin: '-100px' }
    },
    staggerContainer: {
      initial: {},
      whileInView: {},
      viewport: { once: true, margin: '-100px' },
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  // Hover animations
  hoverAnimations: {
    scale: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.98 },
      transition: { type: 'spring', stiffness: 300, damping: 17 }
    },
    lift: {
      whileHover: { y: -8, scale: 1.02 },
      whileTap: { y: -2, scale: 1.01 },
      transition: { type: 'spring', stiffness: 300, damping: 17 }
    },
    button: {
      whileHover: { scale: 1.05, backgroundColor: 'var(--hover-color)' },
      whileTap: { scale: 0.98 },
      transition: { type: 'spring', stiffness: 400, damping: 17 }
    }
  },

  // Page transitions
  pageTransitions: {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.4, ease: 'easeInOut' }
    }
  }
}