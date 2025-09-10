'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}

interface ParticleFieldProps {
  count?: number
  colors?: string[]
  className?: string
  animated?: boolean
  burst?: boolean
  onAnimationComplete?: () => void
}

export function ParticleField({
  count = 20,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
  className = '',
  animated = true,
  burst = false,
  onAnimationComplete
}: ParticleFieldProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: burst ? 50 : Math.random() * 100,
      y: burst ? 50 : Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: burst ? i * 0.05 : Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
  }, [count, colors, burst])

  if (burst) {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        {particles.map((particle) => {
          const angle = (particle.id / count) * Math.PI * 2
          const distance = 100 + Math.random() * 100
          const endX = 50 + Math.cos(angle) * distance
          const endY = 50 + Math.sin(angle) * distance

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                background: particle.color,
                left: '50%',
                top: '50%',
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2
              }}
              initial={{
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1
              }}
              animate={{
                scale: [0, 1.5, 0],
                x: `${endX - 50}%`,
                y: `${endY - 50}%`,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1,
                delay: particle.delay,
                ease: 'easeOut'
              }}
              onAnimationComplete={() => {
                if (particle.id === particles.length - 1 && onAnimationComplete) {
                  onAnimationComplete()
                }
              }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            filter: 'blur(1px)'
          }}
          animate={animated ? {
            x: [0, 20, -20, 0],
            y: [0, -30, 10, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.6, 0.3]
          } : {}}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

export default ParticleField