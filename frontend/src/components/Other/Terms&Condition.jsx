
export const TermsAndConditions = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-3xl m-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 text-gray-900">
        Terms and Conditions
      </h1>
      
      <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Effective Date: 13.06.2025
        </p>
        
        <p className="leading-relaxed">
          Welcome to TktPlz. Please read these terms and conditions carefully before using our platform.
        </p>

        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-400">
          <h2 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Payment & Refund Policy</h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
              <span className="text-xs sm:text-sm leading-relaxed">
                All payments are processed securely through our payments gateway.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
              <span className="text-xs sm:text-sm leading-relaxed">
                Tickets are non-transferrable and non-refundable except in cases where the event is canceled by the organizers or due to technical issues recognized by TktPlz.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-lg p-3 sm:p-4 border-l-4 border-green-400">
          <h2 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">User Responsibilities</h2>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1 flex-shrink-0">•</span>
              <span className="text-xs sm:text-sm leading-relaxed">
                Provide accurate and up-to-date information during booking and account registration.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1 flex-shrink-0">•</span>
              <span className="text-xs sm:text-sm leading-relaxed">
                Keep your account credentials confidential and do not share them with third parties.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1 flex-shrink-0">•</span>
              <span className="text-xs sm:text-sm leading-relaxed">
                Use the platform responsibly and avoid unlawful or prohibited activity.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <h2 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Intellectual Property</h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            All content on TktPlz, including text, logos, graphics, and media, is the intellectual property of TktPlz or its respective rights holders.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border-l-4 border-purple-400">
          <h2 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Contact Us</h2>
          <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
            For any inquiries, please reach us at{' '}
            <a 
              href="mailto:support@tktplz.com" 
              className="text-purple-600 hover:text-purple-800 underline font-medium break-all"
            >
              support@tktplz.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

