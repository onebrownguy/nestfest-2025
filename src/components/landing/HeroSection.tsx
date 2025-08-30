'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui'
import { ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline'
import { motionConfig } from '@/providers/motion-provider'
import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 300])
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ACC Campus Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ y }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        {/* ACC Campus Background Image */}
        <Image
          src="/acc-campus-hero.jpg"
          alt="Austin Community College Campus - Modern Architecture"
          fill
          className="object-cover object-center"
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </motion.div>

      {/* Gradient Overlay for Text Readability */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900/75 via-purple-900/80 to-indigo-900/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
      
      {/* Enhanced floating particles that complement the campus image */}
      <div className="absolute inset-0 z-10">
        {[...Array(25)].map((_, i) => {
          // Use seeded values to prevent hydration mismatch
          const seedX = (i * 73.7 + 23.1) % 100;
          const seedY = (i * 41.3 + 17.9) % 100;
          const seedDuration = (i * 1.3 + 3) % 4 + 3;
          const seedDelay = (i * 0.7) % 3;
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/70 rounded-full blur-sm"
              initial={{ 
                x: `${seedX}%`,
                y: `${seedY}%`,
                opacity: 0 
              }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0],
                y: [0, -30, 0]
              }}
              transition={{
                duration: seedDuration,
                repeat: Infinity,
                delay: seedDelay,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="max-w-5xl mx-auto"
        >
          {/* Coming Fall 2025 Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="inline-flex items-center px-6 py-2 mb-8 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg"
          >
            <span className="text-sm font-medium drop-shadow-sm">🚀 Coming Fall 2025 at ACC</span>
          </motion.div>

          {/* Main Headlines */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg"
          >
            <span className="drop-shadow-md">ACC's First Ever</span>{' '}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 drop-shadow-lg"
              style={{
                backgroundSize: '200% 100%',
              }}
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              Startup Competition
            </motion.span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-2xl md:text-3xl font-light mb-8 text-white drop-shadow-md"
          >
            Building a community where{' '}
            <span className="font-semibold text-yellow-300 drop-shadow-sm">big ideas take flight</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-lg md:text-xl mb-12 max-w-3xl mx-auto text-white/95 leading-relaxed drop-shadow-sm"
          >
            Join Austin Community College's inaugural startup competition. 
            Connect with fellow innovators, pitch your ideas, and turn your 
            entrepreneurial dreams into reality on our beautiful campus.
          </motion.p>

          {/* Call-to-Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <motion.div {...motionConfig.hoverAnimations.button}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold px-8 py-4 text-lg shadow-xl"
                >
                  Register Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>

            <motion.button
              {...motionConfig.hoverAnimations.scale}
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <PlayIcon className="mr-2 h-5 w-5" />
              Watch Preview
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/20"
          >
            {[
              { number: '$75K', label: 'Prize Pool' },
              { number: '500+', label: 'Expected Participants' },
              { number: '15', label: 'Partner Universities' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 + index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/70 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}