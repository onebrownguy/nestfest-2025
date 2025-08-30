'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { motionConfig } from '@/providers/motion-provider'
import Link from 'next/link'

export function RegisterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle email subscription
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <section id="register" className="py-24 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/20" />
        {[...Array(30)].map((_, i) => {
          // Use seeded values to prevent hydration mismatch
          const seedX = (i * 47.3 + 13.7) % 100;
          const seedY = (i * 31.1 + 7.9) % 100;
          const seedDuration = (i * 0.8 + 3) % 4 + 3;
          const seedDelay = (i * 0.4) % 2;
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              initial={{ 
                x: `${seedX}%`,
                y: `${seedY}%`,
              }}
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: seedDuration,
                repeat: Infinity,
                delay: seedDelay
              }}
            />
          );
        })}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="max-w-4xl mx-auto text-center text-white"
        >
          {/* Header */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join NestFest 2025?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
            Be the first to know when registration opens. Get exclusive updates, 
            early access, and insider information about prizes and events.
          </p>

          {/* Registration Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Early Access Signup */}
            <motion.div
              {...motionConfig.scrollAnimations.fadeInLeft}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-bold mb-4">Get Early Access</h3>
              <p className="text-blue-100 mb-6">
                Join our waitlist for exclusive updates and be first to register when we launch.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitted}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitted ? 'Thank you!' : 'Get Started'}
                </motion.button>
              </form>
            </motion.div>

            {/* Full Registration */}
            <motion.div
              {...motionConfig.scrollAnimations.fadeInRight}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-bold mb-4">Full Registration</h3>
              <p className="text-blue-100 mb-6">
                Ready to compete? Create your full NestFest account and complete your registration.
              </p>
              
              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="block"
                >
                  <Button
                    size="lg"
                    className="w-full bg-white text-blue-600 font-semibold py-3 hover:bg-gray-50 transition-colors"
                  >
                    Register Now
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Key Dates */}
          <motion.div
            {...motionConfig.scrollAnimations.fadeInUp}
            className="grid md:grid-cols-3 gap-6 text-center"
          >
            {[
              { date: 'August 2025', event: 'Registration Opens' },
              { date: 'October 2025', event: 'Competition Begins' },
              { date: 'December 2025', event: 'Finals & Awards' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                viewport={{ once: true }}
                className="bg-white/5 rounded-lg p-6 border border-white/10"
              >
                <div className="text-yellow-400 font-bold text-lg mb-2">{item.date}</div>
                <div className="text-blue-100">{item.event}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}