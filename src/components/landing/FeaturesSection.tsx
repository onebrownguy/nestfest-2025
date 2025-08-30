'use client'

import { motion } from 'framer-motion'
import { 
  MicrophoneIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { motionConfig } from '@/providers/motion-provider'

const features = [
  {
    icon: MicrophoneIcon,
    title: 'Speakers',
    description: 'Industry leaders and successful entrepreneurs sharing insights and experience',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: UserGroupIcon,
    title: 'Organizers',
    description: 'Dedicated team from ACC\'s Entrepreneurship & Innovation Academy',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: AcademicCapIcon,
    title: 'Attendees',
    description: 'Passionate students and aspiring entrepreneurs from across Texas',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: BookOpenIcon,
    title: 'Resources',
    description: 'Access to mentorship, funding opportunities, and business development tools',
    color: 'from-orange-500 to-orange-600'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Makes NestFest Special
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our inaugural competition brings together the best of entrepreneurship education,
            industry expertise, and student innovation in one extraordinary event.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          {...motionConfig.scrollAnimations.staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              {...motionConfig.scrollAnimations.fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 17 }}
              className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 300 }}
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover effect indicator */}
              <motion.div
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} rounded-full transition-all duration-300`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          {...motionConfig.scrollAnimations.fadeInUp}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Learn More About Our Program
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}