import React from 'react'
import Link from 'next/link'
import { 
  TrophyIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the NestFest team. We are here to help with any questions about competitions, submissions, or technical support.'
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <TrophyIcon className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">NestFest</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">About</Link>
              <Link href="/rules" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Rules</Link>
              <Link href="/showcase" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Showcase</Link>
              <Link href="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact NestFest
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Have questions about NestFest 2025? Need help with registration or submissions? 
            Our team is here to support you every step of the way.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Get in Touch</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-4">
                <EnvelopeIcon className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    For general questions and support
                  </p>
                  <a 
                    href="mailto:support@edge-team.org" 
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                  >
                    support@edge-team.org
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <PhoneIcon className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Phone Support</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Monday - Friday, 9:00 AM - 5:00 PM CT
                  </p>
                  <a 
                    href="tel:+1-512-223-4000" 
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                  >
                    (512) 223-4000
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <MapPinIcon className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Campus Location</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Austin Community College<br />
                    5930 Middle Fiskville Rd<br />
                    Austin, TX 78752
                  </p>
                </div>
              </div>

              {/* Office Hours */}
              <div className="flex items-start space-x-4">
                <ClockIcon className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Support Hours</h3>
                  <div className="text-gray-600 dark:text-gray-300 mt-1">
                    <p>Monday - Friday: 9:00 AM - 5:00 PM CT</p>
                    <p>Saturday: 10:00 AM - 2:00 PM CT</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Support Links */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Support</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <QuestionMarkCircleIcon className="h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">FAQ</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Find answers to common questions
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Live Chat</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Chat with our support team
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your first name"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option>General Question</option>
                  <option>Competition Help</option>
                  <option>Registration Issue</option>
                  <option>Technical Support</option>
                  <option>Partnership Inquiry</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Send Message
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We typically respond within 24 hours during business days. 
                For urgent issues, please call our support line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}