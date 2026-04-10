import React, { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle, XCircle, Camera, User, Calendar, MapPin } from 'lucide-react';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (result) => {
    if (result && !loading) {
      setIsScanning(false);
      setScanResult(result[0].rawValue);
      await verifyTicket(result[0].rawValue);
    }
  };

  const verifyTicket = async (qrData) => {
    setLoading(true);
    try {
      const parsedData = JSON.parse(qrData);
      const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/organizer/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ticketId: parsedData.ticketId,
          hash: parsedData.hash
        })
      });

      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Invalid QR code format'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setVerificationResult(null);
    setIsScanning(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Header - Mobile Only */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">QR Scanner</h1>
          </div>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b px-6 py-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">QR Scanner</h1>
              <p className="text-sm text-gray-600">Verify ticket authenticity</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-2">
          {isScanning && (
            <div className="w-full max-w-lg">
              <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200">
                <Scanner
                  onScan={handleScan}
                  onError={(error) => console.error(error)}
                  constraints={{ width: 400, height: 400 }}
                />
              </div>
              <p className="text-center text-gray-700 mt-2 text-sm font-medium">
                Align QR code with camera view
              </p>
            </div>
          )}
          
          {loading && (
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Verifying</h3>
              <p className="text-gray-600 text-sm">Please wait...</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:w-80 bg-white shadow-lg lg:border-l border-gray-200 flex flex-col h-80 sm:h-96 md:h-[500px] lg:h-[500px] xl:h-[550px]">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Results</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          {!verificationResult && !loading && (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Ready to scan</p>
            </div>
          )}
          
          {verificationResult && !loading && (
            <div className="p-4">
              <div className={`rounded-lg p-4 border ${
                verificationResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-center mb-3">
                  {verificationResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                
                <h3 className={`font-bold text-center mb-2 ${
                  verificationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.success ? 'Entry Approved' : 'Entry Denied'}
                </h3>
                
                <p className={`text-center mb-3 text-sm ${
                  verificationResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult.message}
                </p>

                {verificationResult.success && verificationResult.ticketDetails && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{verificationResult.ticketDetails.holderName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 truncate">{verificationResult.ticketDetails.eventName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{verificationResult.ticketDetails.seatInfo || 'General'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          verificationResult.ticketDetails.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {verificationResult.ticketDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={resetScanner}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Scan Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;