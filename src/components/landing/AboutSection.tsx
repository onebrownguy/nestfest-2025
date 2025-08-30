'use client'

import { motion } from 'framer-motion'
import { motionConfig } from '@/providers/motion-provider'
import { AcademicCapIcon, LightBulbIcon, UsersIcon } from '@heroicons/react/24/outline'

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            {...motionConfig.scrollAnimations.fadeInLeft}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-6">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Entrepreneurship & Innovation Academy</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Where Big Ideas Take Flight
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              NestFest represents Austin Community College's commitment to fostering 
              entrepreneurial spirit and innovation among students. Our inaugural 
              startup competition creates a nurturing environment where ambitious 
              ideas can grow and flourish.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: LightBulbIcon,
                  title: 'Innovation Focus',
                  description: 'Encouraging creative solutions to real-world problems'
                },
                {
                  icon: UsersIcon,
                  title: 'Community Building',
                  description: 'Connecting like-minded entrepreneurs and mentors'
                },
                {
                  icon: AcademicCapIcon,
                  title: 'Educational Excellence',
                  description: 'Combining academic rigor with practical experience'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            {...motionConfig.scrollAnimations.fadeInRight}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white">
              <div className="absolute inset-0 bg-black/20 rounded-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">ACC Students Group</h3>
                <p className="text-blue-100 mb-6">
                  Join hundreds of passionate students ready to turn their ideas into reality.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm text-blue-200">Students</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">15</div>
                    <div className="text-sm text-blue-200">Programs</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">$75K</div>
                    <div className="text-sm text-blue-200">Prizes</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}