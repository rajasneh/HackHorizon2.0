import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Send, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    console.log("User : ", user);
    if ( user ) {
      setFormData(prev => ({
        ...prev,
        name: user?.userData?.name || user?.name || '',
        email: user?.userData?.email || user?.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Image size should be less than 2MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Replace with actual API endpoint
      const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/user/submit-issue', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: formData.name, // Keep name and email if user is authenticated
          email: formData.email,
          subject: '',
          description: '',
          image: null
        });
        setImagePreview(null);
      } else {
        throw new Error('Failed to submit issue');
      }
    } catch (err) {
      setError('Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center border border-gray-200">
          <img 
            src="/images/logo2.PNG" 
            alt="TktPlz Logo" 
            className="h-10 sm:h-12 w-auto mx-auto mb-4 sm:mb-6"
          />
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base px-2">
            We've received your message and will get back to you as soon as possible.
          </p>
          <div className="flex flex-col gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4" />
               Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex flex-col items-center justify-center py-4 sm:py-6 px-4 sm:px-6 border-b border-gray-100">
            <button
              onClick={() => navigate('/')}
              className="self-start flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer mb-4 sm:mb-6 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
            
            <img 
              src="/images/logo2.PNG" 
              alt="TktPlz Logo" 
              className="h-12 sm:h-16 w-auto mb-4 sm:mb-6"
            />
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 text-center">How can we help you?</h1>
            <p className="text-gray-500 text-center text-sm sm:text-base px-2">Please fill out the form below and we'll get back to you as soon as possible</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm sm:text-base">{error}</p>
              </div>
            )}

            {/* Name and Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
                placeholder="Please provide detailed information about the issue..."
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Screenshot (Optional)
              </label>
              <div className="space-y-3 sm:space-y-4">
                {!imagePreview ? (
                  <div className="border border-dashed border-gray-300 rounded-md p-4 sm:p-6 text-center hover:border-blue-400 transition-colors bg-gray-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-1 text-sm sm:text-base">Click to upload a screenshot</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-md overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 sm:h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 sm:py-3.5 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Issue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;