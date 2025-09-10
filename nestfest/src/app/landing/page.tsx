import { HeroSection } from '@/components/landing/HeroSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { VisionSection } from '@/components/landing/VisionSection'
import { RegisterSection } from '@/components/landing/RegisterSection'
import { ContactSection } from '@/components/landing/ContactSection'
import { LandingNavbar } from '@/components/landing/LandingNavbar'

export const metadata = {
  title: 'NestFest 2025 - ACC\'s First Ever Startup Competition',
  description: 'Building a community where big ideas take flight. Join Austin Community College\'s inaugural startup competition coming Fall 2025.',
  keywords: ['startup competition', 'Austin Community College', 'entrepreneurship', 'innovation', 'ACC', 'NestFest'],
  openGraph: {
    title: 'NestFest 2025 - ACC\'s First Ever Startup Competition',
    description: 'Building a community where big ideas take flight. Join Austin Community College\'s inaugural startup competition coming Fall 2025.',
    url: 'https://nestfest.app/landing',
    images: [
      {
        url: '/og-nestfest-landing.jpg',
        width: 1200,
        height: 630,
        alt: 'NestFest 2025 - Startup Competition'
      }
    ],
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <LandingNavbar />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Vision Section */}
      <VisionSection />
      
      {/* Registration Section */}
      <RegisterSection />
      
      {/* Contact Section */}
      <ContactSection />
    </main>
  )
}