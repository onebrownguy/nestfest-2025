import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="mb-4">
          <p className="text-gray-700 font-medium text-sm">
            NEST FEST - Austin Community College
          </p>
        </div>
        
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
          <Link 
            href="/privacy" 
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            href="/terms" 
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
          >
            Terms & Conditions
          </Link>
          <span className="text-gray-300">|</span>
          <a 
            href="mailto:entrepreneurshipacademy@austincc.edu"
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
          >
            Contact
          </a>
        </div>
        
        <p className="text-xs text-gray-500">
          © 2025 Austin Community College. All rights reserved.
        </p>
      </div>
    </footer>
  )
}