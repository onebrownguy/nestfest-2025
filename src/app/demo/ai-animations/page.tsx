'use client'

import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import AIEnhancedFormTextarea from '@/components/ui/AIEnhancedFormTextarea'
import AILoadingSpinner from '@/components/ui/AILoadingSpinner'
import ParticleField from '@/components/effects/ParticleField'
import { SparklesIcon, BeakerIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'

export default function AIAnimationsDemo() {
  const [showSpinner, setShowSpinner] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  
  const methods = useForm({
    defaultValues: {
      projectDescription: '',
      eventDetails: ''
    }
  })

  const handleShowSpinner = () => {
    setShowSpinner(true)
    setTimeout(() => setShowSpinner(false), 3000)
  }

  const handleParticleBurst = () => {
    setShowBurst(true)
    setTimeout(() => setShowBurst(false), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Ambient particle field */}
      <ParticleField count={15} animated={true} className="fixed inset-0 z-0" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header with animation */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              backgroundSize: '200% 200%'
            }}
          >
            AI Enhancement Animations
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Experience premium animations and visual effects for the NestFest AI system
          </motion.p>
        </motion.div>

        {/* Demo Cards */}
        <div className="grid gap-8 max-w-6xl mx-auto">
          
          {/* AI Enhanced Textarea Demo */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center mb-6">
                <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  AI-Enhanced Text Input
                </h2>
              </div>
              
              <FormProvider {...methods}>
                <form className="space-y-6">
                  <AIEnhancedFormTextarea
                    name="projectDescription"
                    label="Project Description"
                    placeholder="Start typing your project description... (150+ characters to activate AI)"
                    helperText="Describe your project in detail. AI enhancement becomes available after 150 characters."
                    required
                    rows={6}
                    maxLength={500}
                    aiThreshold={150}
                  />
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="mb-2">✨ Features demonstrated:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Spring physics animations on all interactions</li>
                      <li>Particle effects on button hover</li>
                      <li>Circular progress indicator with gradient</li>
                      <li>Floating orbs on focus</li>
                      <li>Success animation overlay</li>
                      <li>Advanced modal transitions</li>
                    </ul>
                  </div>
                </form>
              </FormProvider>
            </div>
          </motion.div>

          {/* Loading Spinners Demo */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center mb-6">
                <BeakerIcon className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  AI Loading States
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Small</h3>
                  <AILoadingSpinner size="small" text="" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Medium</h3>
                  <AILoadingSpinner size="medium" text="Processing..." />
                </div>
                
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Large</h3>
                  <AILoadingSpinner size="large" text="Enhancing with AI..." />
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <motion.button
                  onClick={handleShowSpinner}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Show Loading Animation
                </motion.button>
              </div>
              
              <AnimatePresence>
                {showSpinner && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl"
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                    >
                      <AILoadingSpinner size="large" text="Enhancing your content..." />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Particle Effects Demo */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <div className="flex items-center mb-6">
                <RocketLaunchIcon className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Particle Effects
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden">
                  <ParticleField 
                    count={20} 
                    colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                    animated={true}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      Ambient Particle Field
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <motion.button
                    onClick={() => setShowParticles(!showParticles)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Toggle Particles
                  </motion.button>
                  
                  <motion.button
                    onClick={handleParticleBurst}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium shadow-lg relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Particle Burst
                    {showBurst && (
                      <ParticleField 
                        count={30} 
                        burst={true}
                        onAnimationComplete={() => setShowBurst(false)}
                      />
                    )}
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {showParticles && (
                    <motion.div 
                      className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 192 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ParticleField 
                        count={25} 
                        colors={['#f59e0b', '#ef4444', '#10b981', '#3b82f6']}
                        animated={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Animation Stats */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'FPS Target', value: '60' },
                { label: 'GPU Acceleration', value: 'Enabled' },
                { label: 'Animation Library', value: 'Framer Motion' },
                { label: 'Optimization', value: 'Production Ready' }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}