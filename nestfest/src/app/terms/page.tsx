'use client';

import { useEffect } from 'react';

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = 'Terms and Conditions - NestFest';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg">
        <div className="px-6 py-8 sm:px-12 sm:py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using the NestFest platform ("Platform"), you agree to be bound by these Terms and Conditions ("Terms"). 
                If you disagree with any part of these terms, you do not have permission to access the Platform.
              </p>
              <p className="text-gray-700">
                These Terms apply to all visitors, users, and others who access or use the Platform, including but not limited to 
                students, judges, reviewers, administrators, and educational institutions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. User Accounts</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Account Creation</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You must provide accurate, complete, and current information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 13 years old to create an account</li>
                <li>Users under 18 require parental or guardian consent</li>
                <li>One person may not create multiple accounts without authorization</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Account Responsibilities</h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
                <li>You may not transfer your account to another person</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Competition Rules</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Participation</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Participants must meet eligibility requirements for specific competitions</li>
                <li>All submissions must be original work or properly attributed</li>
                <li>Participants grant NestFest a non-exclusive license to display submissions</li>
                <li>Submissions must not violate any intellectual property rights</li>
                <li>Participants must comply with competition-specific rules and deadlines</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Judging and Voting</h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Judges must disclose any conflicts of interest</li>
                <li>Voting must be fair and based on merit</li>
                <li>Manipulation of voting systems is strictly prohibited</li>
                <li>Final decisions by judges are binding</li>
                <li>We reserve the right to audit voting patterns for fraud detection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">You may not use the Platform to:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Violate any laws or regulations</li>
                <li>Submit false or misleading information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Upload malicious code or interfere with Platform operations</li>
                <li>Attempt unauthorized access to any part of the Platform</li>
                <li>Scrape or harvest user data without permission</li>
                <li>Engage in plagiarism or academic dishonesty</li>
                <li>Manipulate competition results or voting systems</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Platform for commercial purposes without authorization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Intellectual Property</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Platform Content</h3>
              <p className="text-gray-700 mb-4">
                The Platform and its original content (excluding user submissions) are owned by NestFest and are protected by 
                international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">User Submissions</h3>
              <p className="text-gray-700 mb-4">
                By submitting content to the Platform, you:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Retain ownership of your original work</li>
                <li>Grant NestFest a worldwide, non-exclusive license to use, display, and distribute your submission for Platform operations</li>
                <li>Warrant that you have the right to submit the content</li>
                <li>Agree that submissions may be viewed by judges, participants, and the public (depending on competition settings)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700">
                Your use of the Platform is also governed by our Privacy Policy. By using the Platform, you consent to our 
                collection and use of personal information as outlined in the Privacy Policy. We comply with applicable data 
                protection laws including GDPR and FERPA where applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Disclaimers and Limitations</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Service Availability</h3>
              <p className="text-gray-700 mb-4">
                The Platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted, secure, 
                or error-free operation of the Platform.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, NestFest shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages arising from your use of the Platform.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Indemnification</h3>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless NestFest from any claims arising from your violation of these Terms 
                or your use of the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these Terms or your use of the Platform shall be resolved through:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>First, good faith negotiations between the parties</li>
                <li>If unsuccessful, binding arbitration in accordance with applicable arbitration rules</li>
                <li>Small claims court for qualifying disputes</li>
              </ul>
              <p className="text-gray-700 mt-4">
                These Terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Material changes will be notified to users via email 
                or Platform announcement. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Violation of these Terms</li>
                <li>Conduct that we believe is harmful to other users or the Platform</li>
                <li>Failure to comply with applicable laws</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Upon termination, your right to use the Platform will cease immediately. Some provisions of these Terms will 
                survive termination, including intellectual property rights and limitation of liability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-gray-700">
                  <strong>NestFest Legal Team</strong><br />
                  Email: legal@nestfest.com<br />
                  Address: [Your Organization Address]<br />
                  Phone: [Your Contact Number]
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                © {new Date().getFullYear()} NestFest. All rights reserved. | 
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 mx-2">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}