import { LoginForm } from '@/components/auth/login-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              🏆 NEST FEST 2025
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              The Premier Student Entrepreneurship Competition
            </p>
            <p className="text-lg text-blue-200 mb-12 max-w-2xl mx-auto">
              Join thousands of students competing for over $200,000 in prizes across technology, sustainability, and social impact challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="#login">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div id="login" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Access Your Dashboard
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Sign in to manage your competitions, submit projects, or judge submissions.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Real-time competition updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Streamlined submission process</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Advanced judging tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Performance analytics</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Status */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Platform Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Authentication</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">Secure login system operational</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Competitions</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">4 active competitions running</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Judging System</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">Real-time scoring available</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">Optimized for speed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Links */}
      <div id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Competition Categories
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-xl text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold mb-3">Tech Innovation</h3>
              <p className="text-blue-100 mb-4">Develop cutting-edge technology solutions</p>
              <div className="text-2xl font-bold">$50,000</div>
              <div className="text-sm text-blue-200">Prize Pool</div>
            </div>

            <div className="group bg-gradient-to-r from-green-500 to-green-600 p-8 rounded-xl text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-3">Sustainability</h3>
              <p className="text-green-100 mb-4">Create sustainable business models</p>
              <div className="text-2xl font-bold">$35,000</div>
              <div className="text-sm text-green-200">Prize Pool</div>
            </div>

            <div className="group bg-gradient-to-r from-purple-500 to-purple-600 p-8 rounded-xl text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Social Impact</h3>
              <p className="text-purple-100 mb-4">Build solutions for social good</p>
              <div className="text-2xl font-bold">$25,000</div>
              <div className="text-sm text-purple-200">Prize Pool</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Entrepreneurial Journey?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of students from top universities competing in the most prestigious entrepreneurship competition.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="#login">Join NEST FEST 2025</Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}