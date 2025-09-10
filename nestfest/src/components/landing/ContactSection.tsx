'use client'

import { motion } from 'framer-motion'
import { 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'
import { motionConfig } from '@/providers/motion-provider'

const contactInfo = [
  {
    icon: MapPinIcon,
    title: 'Campus Location',
    details: [
      'Austin Community College',
      '5930 Middle Fiskville Rd',
      'Austin, TX 78752'
    ]
  },
  {
    icon: EnvelopeIcon,
    title: 'Email Contact',
    details: [
      'admin@edge-team.org'
    ]
  },
  {
    icon: ClockIcon,
    title: 'Operating Hours',
    details: [
      'Mon - Fri: 9:00 AM - 5:00 PM CT',
      'Sat: 10:00 AM - 2:00 PM CT',
      'Sun: Closed'
    ]
  }
]

export function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have questions about NestFest 2025? Our team is here to help you 
            every step of the way on your entrepreneurial journey.
          </p>
        </motion.div>

        {/* Contact Grid */}
        <motion.div
          {...motionConfig.scrollAnimations.staggerContainer}
          className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto"
        >
          {contactInfo.map((item, index) => (
            <motion.div
              key={item.title}
              {...motionConfig.scrollAnimations.fadeInUp}
              whileHover={{ y: -5 }}
              className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-6">
                <item.icon className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-semibold mb-4">{item.title}</h3>
              
              <div className="space-y-2">
                {item.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-300 text-sm">
                    {detail}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="text-center pt-12 border-t border-gray-800"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">NF</span>
            </div>
            <span className="text-2xl font-bold">NestFest 2025</span>
          </div>
          
          <p className="text-gray-400 mb-6">
            Austin Community College's First Ever Startup Competition
          </p>
          
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#register" className="hover:text-white transition-colors">Register</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 text-gray-500 text-sm">
            © 2025 NestFest. All rights reserved. Powered by Austin Community College.
          </div>
        </motion.div>
      </div>
    </section>
  )
}