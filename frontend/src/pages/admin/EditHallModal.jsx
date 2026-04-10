import React, { useState, useEffect } from 'react';
import { LocationPicker } from "../../components/Other/LocationPicker";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { 
  Building2, 
  MapPin, 
  Monitor, 
  X, 
  Save,
  AlertCircle
} from 'lucide-react';

export const EditHallModal = ({ isOpen, onClose, hallData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const queryClient = useQueryClient();

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [editForm, setEditForm] = useState({
    name: "",
    area_name: "",
    location: { lat: 0, lng: 0 },
    city: "",
    state: "",
    pincode: "",
    totalScreens: 0
  });

  // Initialize form with hall data when modal opens
  useEffect(() => {
    if (hallData && isOpen) {
      setEditForm({
        name: hallData.name || "",
        area_name: hallData.area_name || "",
        location: { 
          lat: parseFloat(hallData.latitude) || 0, 
          lng: parseFloat(hallData.longitude) || 0 
        },
        city: hallData.city || "",
        state: hallData.state || "",
        pincode: hallData.pincode || "",
        totalScreens: hallData.totalScreens?.length || 0
      });
    }
  }, [hallData, isOpen]);

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSelect = (location) => {
    setEditForm(prev => ({
      ...prev,
      location,
    }));
    setIsLocationPickerOpen(false);
  };

  const validateForm = () => {
    if (!editForm.name.trim()) {
      toast.error("Hall name is required");
      return false;
    }
    if (!editForm.area_name.trim()) {
      toast.error("Area name is required");
      return false;
    }
    if (!editForm.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!editForm.state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!editForm.pincode.trim() || editForm.pincode.length !== 6) {
      toast.error("Pincode must be a 6-digit number");
      return false;
    }
    if (editForm.totalScreens < 1) {
      toast.error("Number of screens must be at least 1");
      return false;
    }
    if (editForm.location.lat === 0 && editForm.location.lng === 0) {
      toast.error("Please select a location");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(`${BASE_URL}/api/halls/editHall/${hallData.id}`, editForm);
      
      if (response.data.success) {
        toast.success("Hall updated successfully!");
        
        // Invalidate and refetch hall data
        await queryClient.invalidateQueries({ queryKey: ['hall', hallData.id] });
        await queryClient.invalidateQueries({ queryKey: ['hallData'] });
        
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update hall");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Edit Hall</h2>
                  <p className="text-gray-600 text-sm">Update hall information and details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hall Name */}
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Hall Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter hall name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Area Name */}
              <div>
                <label htmlFor="edit-area_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Area Name *
                </label>
                <input
                  id="edit-area_name"
                  type="text"
                  value={editForm.area_name}
                  onChange={(e) => handleInputChange('area_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter area name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <button
                  type="button"
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <MapPin className="w-4 h-4" />
                  {editForm.location.lat === 0 && editForm.location.lng === 0
                    ? "Select Location"
                    : `Lat: ${editForm.location.lat.toFixed(4)}, Lng: ${editForm.location.lng.toFixed(4)}`}
                </button>
              </div>

              {/* City */}
              <div>
                <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  id="edit-city"
                  type="text"
                  value={editForm.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter city name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* State */}
              <div>
                <label htmlFor="edit-state" className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  id="edit-state"
                  type="text"
                  value={editForm.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter state name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="edit-pincode" className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                <input
                  id="edit-pincode"
                  type="text"
                  pattern="[0-9]{6}"
                  title="Pincode must be a 6-digit number"
                  value={editForm.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Total Screens */}
              <div>
                <label htmlFor="edit-totalScreens" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Screens *
                </label>
                <input
                  id="edit-totalScreens"
                  type="number"
                  min={1}
                  placeholder="Enter number of screens"
                  value={editForm.totalScreens === 0 ? '' : editForm.totalScreens}
                  onChange={(e) => handleInputChange('totalScreens', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Warning about screen changes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important Note</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing the number of screens may affect existing screen configurations and seat layouts. 
                    Please ensure this change is necessary before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Hall
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Location Picker Modal */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Select Location
                </h2>
                <button
                  onClick={() => setIsLocationPickerOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close location picker"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 