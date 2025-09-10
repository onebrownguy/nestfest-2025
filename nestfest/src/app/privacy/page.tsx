'use client';

import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - NestFest';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg">
        <div className="px-6 py-8 sm:px-12 sm:py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to NestFest ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our competition platform.
              </p>
              <p className="text-gray-700">
                By using NestFest, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Educational institution and student/faculty ID</li>
                <li>Account credentials and authentication data</li>
                <li>Profile information (biography, skills, interests)</li>
                <li>Competition submissions and related content</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Usage Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on pages</li>
                <li>Click patterns and interaction data</li>
                <li>Competition participation history</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Technical Data</h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and error reports</li>
                <li>Performance metrics and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide and maintain our platform services</li>
                <li>Process competition entries and manage events</li>
                <li>Facilitate judging and voting processes</li>
                <li>Send notifications about competitions and results</li>
                <li>Improve user experience and platform functionality</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Communicate updates and announcements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Information Sharing</h2>
              <p className="text-gray-700 mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Competition Organizers:</strong> To facilitate event management</li>
                <li><strong>Judges and Reviewers:</strong> Limited access to evaluate submissions</li>
                <li><strong>Educational Institutions:</strong> For verification and reporting purposes</li>
                <li><strong>Service Providers:</strong> Third-party services that help operate our platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We do not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of certain communications</li>
                <li>Export your data in a portable format</li>
                <li>Lodge a complaint with supervisory authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700">
                Our platform is intended for users who are at least 13 years old. If you are under 18, 
                you may use NestFest only with the involvement of a parent or guardian. We do not knowingly 
                collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Effective Date" above. Your continued use of 
                NestFest after any changes indicates your acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-gray-700">
                  <strong>NestFest Support</strong><br />
                  Email: privacy@nestfest.com<br />
                  Address: [Your Organization Address]<br />
                  Phone: [Your Contact Number]
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                © {new Date().getFullYear()} NestFest. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}