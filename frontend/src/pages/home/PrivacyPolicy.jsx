import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-8 sm:p-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Privacy Policy</h1>
        <p className="text-gray-500 text-center mb-8">Effective Date: <span className="font-semibold">[Insert Date]</span></p>
        <div className="space-y-6 text-gray-700 text-base">
          <p>At TktPlz (“we,” “our,” “us”), your privacy is very important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, mobile application, and related services (collectively, the “Platform”).</p>
          <p>By using TktPlz, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of our Platform.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">1. Information We Collect</h2>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><span className="font-semibold">Personal Information</span>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Payment details (processed securely through our payment partners; we do not store full card details)</li>
                <li>Government-issued ID (only if required for specific events)</li>
              </ul>
            </li>
            <li className="mb-2"><span className="font-semibold">Event &amp; Booking Information</span>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Event preferences and bookings</li>
                <li>Transaction history</li>
                <li>Communication with event organizers</li>
              </ul>
            </li>
            <li className="mb-2"><span className="font-semibold">Technical Information</span>
              <ul className="list-disc pl-6 text-gray-600">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Cookies and usage data (to improve our services and user experience)</li>
              </ul>
            </li>
          </ul>
          <h2 className="text-xl font-bold mt-8 mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Processing bookings and payments</li>
            <li>Providing customer support</li>
            <li>Sending event updates, confirmations, and notifications</li>
            <li>Fraud detection and prevention</li>
            <li>Improving and personalizing the Platform</li>
            <li>Sending promotional offers (only if you opt-in)</li>
          </ul>
          <h2 className="text-xl font-bold mt-8 mb-2">3. Sharing of Information</h2>
          <p>We respect your privacy and do not sell your data. However, we may share information with:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Event Organizers (limited to booking details required to facilitate your participation)</li>
            <li>Payment Gateways (e.g., Razorpay, Stripe, etc.) to securely process transactions</li>
            <li>Service Providers assisting in hosting, analytics, or customer support</li>
            <li>Legal Authorities if required to comply with applicable laws and regulations</li>
          </ul>
          <h2 className="text-xl font-bold mt-8 mb-2">4. Data Security</h2>
          <p>We take appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          <p>Transactions are processed via secure payment gateways, and sensitive data is encrypted using industry-standard security protocols (e.g., SSL/TLS).</p>
          <h2 className="text-xl font-bold mt-8 mb-2">5. Data Retention</h2>
          <p>We retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Access to your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Opt-out of promotional communications</li>
            <li>Withdraw consent at any time (where applicable)</li>
          </ul>
          <p>To exercise these rights, contact us at <span className="font-semibold">[Insert Support Email]</span>.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">7. Cookies &amp; Tracking</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Improve site functionality</li>
            <li>Remember your preferences</li>
            <li>Analyze traffic and usage patterns</li>
          </ul>
          <p>You can control cookies through your browser settings, but some features may not work properly if you disable them.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">8. Third-Party Links</h2>
          <p>Our Platform may contain links to third-party websites. We are not responsible for the privacy practices or content of such external sites.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">9. Children’s Privacy</h2>
          <p>TktPlz does not knowingly collect data from children under 13 years of age. If you believe a child has provided us with personal data, please contact us to remove it.</p>
          <h2 className="text-xl font-bold mt-8 mb-2">10. Updates to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated “Effective Date.”</p>
          <h2 className="text-xl font-bold mt-8 mb-2">11. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, you may contact us at:</p>
          <ul className="list-none pl-0 mb-2 text-gray-700">
            <li className="flex items-center gap-2"><span role="img" aria-label="email">📧</span> <span className="font-semibold">bosesumit058@gmail.com</span></li>
            {/* <li className="flex items-center gap-2"><span role="img" aria-label="website">🌐</span> <span className="font-semibold">[Your Website URL]</span></li> */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;