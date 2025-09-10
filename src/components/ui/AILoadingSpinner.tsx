'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AILoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  className?: string
}

export function AILoadingSpinner({ 
  size = 'medium', 
  text = 'Enhancing with AI...',
  className = '' 
}: AILoadingSpinnerProps) {
  const sizeConfig = {
    small: { container: 40, orb: 8, orbit: 15 },
    medium: { container: 60, orb: 12, orbit: 22 },
    large: { container: 80, orb: 16, orbit: 30 }
  }

  const config = sizeConfig[size]

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Main spinner container */}
      <div 
        className="relative"
        style={{ width: config.container, height: config.container }}
      >
        {/* Central core with pulsing effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: config.orb * 1.5, height: config.orb * 1.5 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Orbiting particles */}
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute top-1/2 left-1/2"
            style={{
              width: config.orb,
              height: config.orb
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.4
            }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                width: config.orb,
                height: config.orb,
                top: -config.orbit,
                left: -config.orb / 2,
                background: `linear-gradient(135deg, 
                  ${index === 0 ? '#3b82f6' : index === 1 ? '#8b5cf6' : '#ec4899'} 0%, 
                  ${index === 0 ? '#60a5fa' : index === 1 ? '#a78bfa' : '#f472b6'} 100%)`
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
              }}
            />
          </motion.div>
        ))}

        {/* Outer ring with rotation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: 'rgba(99, 102, 241, 0.3)',
            borderRightColor: 'rgba(139, 92, 246, 0.3)'
          }}
          animate={{
            rotate: -360
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Inner ring with opposite rotation */}
        <motion.div
          className="absolute inset-2 rounded-full border border-transparent"
          style={{
            borderBottomColor: 'rgba(236, 72, 153, 0.3)',
            borderLeftColor: 'rgba(59, 130, 246, 0.3)'
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Glowing effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            filter: 'blur(10px)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Loading text with typing effect */}
      {text && (
        <div className="flex items-center space-x-1">
          <motion.span 
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.span>
          
          {/* Animated dots */}
          <div className="flex space-x-0.5">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="w-1 h-1 rounded-full bg-gray-500 dark:bg-gray-400"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <motion.div 
        className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: '50%'
          }}
        />
      </motion.div>
    </div>
  )
}

export default AILoadingSpinner