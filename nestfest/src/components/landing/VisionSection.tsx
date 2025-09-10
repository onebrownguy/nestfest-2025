'use client'

import { motion } from 'framer-motion'
import { motionConfig } from '@/providers/motion-provider'
import Image from 'next/image'
import { SparklesIcon, LightBulbIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'

const visionPoints = [
  {
    icon: SparklesIcon,
    title: 'Nurture Innovation',
    description: 'Like eggs in a nest, great ideas need the right environment to hatch and flourish.'
  },
  {
    icon: LightBulbIcon, 
    title: 'Collaborative Growth',
    description: 'Three minds thinking as one - the power of collaboration amplifies every breakthrough.'
  },
  {
    icon: RocketLaunchIcon,
    title: 'Launch Dreams',
    description: 'From concept to reality, we provide the energy and momentum to turn visions into ventures.'
  }
]

export function VisionSection() {
  return (
    <section className="py-24 relative overflow-hidden min-h-screen flex items-center">
      {/* Spatial Nest Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/spatial-nest.png"
          alt="Spatial Nest Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Dark Gradient Overlays for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-900/80 to-indigo-900/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40" />
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Centered Content */}
          <motion.div
            {...motionConfig.scrollAnimations.fadeInUp}
            className="text-white"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 mb-8 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30"
            >
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-300" />
              <span className="text-sm font-medium">Our Vision</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
            >
              Where Ideas Find Their{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Nest
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-blue-100 mb-12 leading-relaxed"
            >
              NestFest isn't just a competition—it's an ecosystem where entrepreneurial 
              dreams take flight. Like the cosmic nest that nurtures new worlds, we create 
              the perfect environment for innovation to emerge, grow, and soar.
            </motion.p>

            {/* Vision Points */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {visionPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <point.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{point.title}</h3>
                  <p className="text-blue-100 leading-relaxed">{point.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  )
}