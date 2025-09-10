'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { useAIEnhancement } from '@/hooks/useAIEnhancement'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { CheckIcon, XMarkIcon, BoltIcon } from '@heroicons/react/24/outline'

// Particle component for sparkle effects
const Particle = ({ delay = 0 }: { delay?: number }) => {
  const randomX = Math.random() * 40 - 20
  const randomY = Math.random() * 40 - 20
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
      initial={{ 
        opacity: 0, 
        scale: 0,
        x: 0,
        y: 0
      }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        x: randomX,
        y: randomY
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
    />
  )
}

// Floating orb component for ambient effects
const FloatingOrb = ({ index }: { index: number }) => {
  const delay = index * 0.2
  const size = 60 + Math.random() * 40
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.2, 1],
        x: [0, 20, 0],
        y: [0, -30, 0],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div 
        className="w-full h-full rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl"
      />
    </motion.div>
  )
}

interface AIEnhancedFormTextareaProps {
  name: string
  label?: string
  placeholder?: string
  helperText?: string
  required?: boolean
  className?: string
  containerClassName?: string
  aiThreshold?: number
  maxLength?: number
  rows?: number
}

export function AIEnhancedFormTextarea({
  name,
  label,
  placeholder,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  aiThreshold = 150,
  maxLength = 450,
  rows = 4
}: AIEnhancedFormTextareaProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext()
  const [showEnhanceButton, setShowEnhanceButton] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [originalText, setOriginalText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const currentValue = watch(name) || ''
  const fieldError = errors[name]

  // Motion values for smooth animations
  const characterCount = useMotionValue(0)
  const springCharCount = useSpring(characterCount, { 
    stiffness: 300, 
    damping: 30 
  })
  
  const progressWidth = useTransform(
    springCharCount,
    [0, maxLength],
    ['0%', '100%']
  )

  const {
    enhanceText,
    isLoading,
    error: aiError,
    lastResult,
    clearError,
    canEnhance
  } = useAIEnhancement({
    onSuccess: (result) => {
      setOriginalText(result.originalText)
      setShowPreview(true)
      triggerSuccessAnimation()
    }
  })

  // Trigger success animation
  const triggerSuccessAnimation = () => {
    setSuccessAnimation(true)
    setTimeout(() => setSuccessAnimation(false), 1500)
  }

  // Calculate character count and determine color stage
  const getCharacterStatus = useCallback((text: string) => {
    const length = text.length
    let colorClass = 'text-gray-500'
    let stage = 'initial'
    let bgGradient = 'from-gray-400 to-gray-500'

    if (length >= aiThreshold && length < 200) {
      colorClass = 'text-blue-600'
      stage = 'blue'
      bgGradient = 'from-blue-400 to-blue-600'
    } else if (length >= 200 && length < 300) {
      colorClass = 'text-green-600'
      stage = 'green'
      bgGradient = 'from-green-400 to-green-600'
    } else if (length >= 300 && length < 400) {
      colorClass = 'text-yellow-600'
      stage = 'yellow'
      bgGradient = 'from-yellow-400 to-yellow-600'
    } else if (length >= 400) {
      colorClass = 'text-red-600'
      stage = 'red'
      bgGradient = 'from-red-400 to-red-600'
    }

    return {
      length,
      colorClass,
      stage,
      bgGradient,
      percentage: Math.min((length / maxLength) * 100, 100),
      canUseAI: length >= aiThreshold && length <= maxLength
    }
  }, [aiThreshold, maxLength])

  const status = getCharacterStatus(currentValue)

  // Update character count motion value
  useEffect(() => {
    characterCount.set(currentValue.length)
  }, [currentValue, characterCount])

  // Show/hide AI button based on threshold with animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEnhanceButton(status.canUseAI)
    }, status.canUseAI ? 0 : 300)
    
    return () => clearTimeout(timer)
  }, [status.canUseAI])

  const handleEnhance = async () => {
    if (!canEnhance(currentValue)) return

    try {
      clearError()
      await enhanceText(currentValue, {
        context: 'project_description',
        tone: 'professional',
        target_length: 'maintain',
        focus_areas: ['clarity', 'impact']
      })
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleAcceptEnhancement = () => {
    if (lastResult) {
      setValue(name, lastResult.enhancedText, { shouldDirty: true, shouldValidate: true })
      setShowPreview(false)
      triggerSuccessAnimation()
    }
  }

  const handleRejectEnhancement = () => {
    if (originalText) {
      setValue(name, originalText, { shouldDirty: true, shouldValidate: true })
      setShowPreview(false)
    }
  }

  const textareaId = `textarea-${name}`

  return (
    <div className={`relative ${containerClassName}`}>
      {/* Ambient floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isFocused && [...Array(3)].map((_, i) => (
          <FloatingOrb key={i} index={i} />
        ))}
      </div>

      {/* Label with animation */}
      {label && (
        <motion.label
          htmlFor={textareaId}
          className={`
            block text-sm font-medium mb-2 transition-colors
            ${fieldError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
          `}
          animate={{
            scale: isFocused ? 1.02 : 1,
            x: isFocused ? 2 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}

      {/* Textarea Container with glow effect */}
      <motion.div 
        className="relative"
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Glow effect backdrop */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        <textarea
          {...register(name, {
            required: required ? `${label || 'This field'} is required` : false,
            maxLength: {
              value: maxLength,
              message: `${label || 'This field'} must not exceed ${maxLength} characters`
            }
          })}
          ref={textareaRef}
          id={textareaId}
          placeholder={placeholder}
          rows={rows}
          disabled={isLoading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            relative w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:border-gray-600 dark:bg-gray-800 dark:text-white
            dark:focus:border-blue-400
            ${fieldError ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          style={{ minHeight: `${rows * 1.5}rem` }}
        />

        {/* Advanced Character Counter */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-3">
          {/* Circular progress indicator */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <motion.circle
                cx="20"
                cy="20"
                r="16"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray={100}
                style={{
                  strokeDashoffset: useTransform(
                    springCharCount,
                    [0, maxLength],
                    [100, 0]
                  )
                }}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${
                    status.stage === 'blue' ? 'text-blue-500' :
                    status.stage === 'green' ? 'text-green-500' :
                    status.stage === 'yellow' ? 'text-yellow-500' :
                    status.stage === 'red' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <stop offset="100%" className={`${
                    status.stage === 'blue' ? 'text-blue-600' :
                    status.stage === 'green' ? 'text-green-600' :
                    status.stage === 'yellow' ? 'text-yellow-600' :
                    status.stage === 'red' ? 'text-red-600' : 'text-gray-500'
                  }`} />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Animated character count in center */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: currentValue.length % 10 === 0 ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <span className={`text-xs font-bold ${status.colorClass}`}>
                {status.length}
              </span>
            </motion.div>
          </div>
          
          {/* Progress bar with gradient */}
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${status.bgGradient} rounded-full`}
              style={{ width: progressWidth }}
              layoutId="progress-bar"
            />
          </div>
        </div>

        {/* AI Enhancement Button with advanced animations */}
        <AnimatePresence mode="wait">
          {showEnhanceButton && (
            <motion.div 
              className="absolute top-3 right-3"
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ 
                x: 0, 
                opacity: 1, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.5
                }
              }}
              exit={{ 
                x: 100, 
                opacity: 0, 
                scale: 0.8,
                transition: { duration: 0.2 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.button
                type="button"
                onClick={handleEnhance}
                disabled={isLoading || !status.canUseAI}
                onMouseEnter={() => setIsHoveringButton(true)}
                onMouseLeave={() => setIsHoveringButton(false)}
                className={`
                  relative flex items-center space-x-2 px-4 py-2 text-xs font-medium
                  text-white rounded-full shadow-lg
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  overflow-hidden
                `}
                style={{
                  background: isLoading 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 opacity-50"
                  animate={{
                    background: [
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                      'linear-gradient(135deg, #f093fb 0%, #667eea 100%)',
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Sparkle particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {isHoveringButton && [...Array(6)].map((_, i) => (
                    <Particle key={i} delay={i * 0.1} />
                  ))}
                </div>

                {/* Button content */}
                <div className="relative flex items-center space-x-2">
                  <motion.div
                    animate={isLoading ? {
                      rotate: 360,
                    } : {
                      rotate: [0, 15, -15, 0],
                    }}
                    transition={isLoading ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    } : {
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </motion.div>
                  
                  <span className="relative">
                    {isLoading ? (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        Enhancing...
                      </motion.span>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        Enhance with AI
                      </motion.span>
                    )}
                  </span>
                </div>

                {/* Loading pulse effect */}
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      opacity: [0, 0.3, 0],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success animation overlay */}
        <AnimatePresence>
          {successAnimation && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.1, 1],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ duration: 0.6 }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 0.8 }}
              >
                <CheckIcon className="w-12 h-12 text-green-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Messages with animation */}
      <AnimatePresence>
        {fieldError && (
          <motion.p 
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {fieldError.message as string}
          </motion.p>
        )}

        {aiError && (
          <motion.div
            className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            AI Enhancement Error: {aiError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text with AI availability indicator */}
      {helperText && !fieldError && !aiError && (
        <motion.div 
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {helperText}
          <AnimatePresence>
            {status.length >= aiThreshold && (
              <motion.span 
                className="ml-2 inline-flex items-center text-blue-600 font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="inline-block mr-1"
                >
                  <BoltIcon className="w-4 h-4" />
                </motion.div>
                AI enhancement available
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Enhancement Preview Modal with advanced animations */}
      <AnimatePresence>
        {showPreview && lastResult && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with gradient */}
              <div className="relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <div className="relative flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <motion.h3 
                      className="text-xl font-semibold text-gray-900 dark:text-white flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <SparklesIcon className="w-6 h-6 mr-2 text-blue-600" />
                      AI Enhancement Preview
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Review the enhanced version and choose to accept or reject the changes
                    </motion.p>
                  </div>
                  <motion.button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Animated Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      label: 'Character Change',
                      value: lastResult.characterCount.change,
                      color: 'blue',
                      icon: '📝'
                    },
                    {
                      label: 'Word Change',
                      value: lastResult.wordCount.change,
                      color: 'green',
                      icon: '💬'
                    },
                    {
                      label: 'Enhancement',
                      value: lastResult.enhancementStrength,
                      color: 'purple',
                      icon: '✨',
                      isText: true
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className={`text-center p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.2 + 0.1 * index,
                          type: "spring",
                          stiffness: 300
                        }}
                        className="text-2xl mb-1"
                      >
                        {stat.icon}
                      </motion.div>
                      <div className={`text-sm text-${stat.color}-600 dark:text-${stat.color}-400`}>
                        {stat.label}
                      </div>
                      <motion.div 
                        className={`text-lg font-bold text-${stat.color}-900 dark:text-${stat.color}-100`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + 0.1 * index }}
                      >
                        {stat.isText ? (
                          <span className="capitalize">{stat.value}</span>
                        ) : (
                          <span>{stat.value > 0 ? '+' : ''}{stat.value}</span>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* Text Comparison with diff animation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Text */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <motion.span 
                        className="w-3 h-3 bg-gray-400 rounded-full mr-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Original ({lastResult.characterCount.original} characters)
                    </h4>
                    <motion.div 
                      className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm leading-relaxed min-h-[150px]"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {lastResult.originalText}
                    </motion.div>
                  </motion.div>

                  {/* Enhanced Text */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <motion.span 
                        className="w-3 h-3 bg-green-500 rounded-full mr-2"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Enhanced ({lastResult.characterCount.enhanced} characters)
                    </h4>
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg text-sm leading-relaxed min-h-[150px] border border-green-200 dark:border-green-800"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {lastResult.enhancedText}
                    </motion.div>
                  </motion.div>
                </div>

                {/* Improvements List with stagger animation */}
                {lastResult.improvements.length > 0 && (
                  <motion.div 
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Improvements Made:
                    </h4>
                    <motion.ul className="space-y-3">
                      {lastResult.improvements.map((improvement, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start space-x-3 text-sm p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              delay: 0.7 + index * 0.1,
                              type: "spring",
                              stiffness: 500
                            }}
                          >
                            <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          </motion.div>
                          <div className="flex-1">
                            <span className="font-medium capitalize text-gray-900 dark:text-white">
                              {improvement.category}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 ml-1">
                              {improvement.description}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </div>

              {/* Modal Actions with hover effects */}
              <motion.div 
                className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={handleRejectEnhancement}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Keep Original
                </motion.button>
                <motion.button
                  onClick={handleAcceptEnhancement}
                  className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ x: '-100%', opacity: 0.3 }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative flex items-center">
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Accept Enhancement
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIEnhancedFormTextarea