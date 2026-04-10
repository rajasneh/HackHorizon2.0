import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { LocationPicker } from "../../components/Other/LocationPicker";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MeetzSpinner } from "../../components/Other/Spinner";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { EditHall } from './EditHall';
import { 
  Building2, 
  MapPin, 
  Monitor, 
  Plus, 
  X, 
  Eye, 
  Edit3, 
  Trash2,
  Search,
  Filter,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';

export const HallManagement = () => {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHallForEdit, setSelectedHallForEdit] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedHallForStatus, setSelectedHallForStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

  const [hallForm, setHallForm] = useState({
    name: "",
    location: { lat: 0, lng: 0 },
    city: "",
    state: "",
    pincode: "",
    totalScreens: 0,
    area_name: "",
    createdById: user?.id || ""
  });

  // Fetch halls
  const fetchHalls = async () => {
    const response = await axios.get(`${BASE_URL}/api/halls/getHalls`);
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hallData'],
    queryFn: fetchHalls,
    staleTime: 0,
  });

  // Submit create hall
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (hallForm.pincode.length !== 6) {
      toast.error("Pincode must be a 6-digit number");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("HALL DATA : ", hallForm);
      await axios.post(`${BASE_URL}/api/halls/registerHall`, hallForm);
      toast.success("Hall created successfully!");

      await queryClient.invalidateQueries({ queryKey: ['hallData'] });

      setIsCreateOpen(false);
      setHallForm({
        name: "",
        location: { lat: 0, lng: 0 },
        city: "",
        state: "",
        pincode: "",
        totalScreens: 0,
        area_name: "",
        createdById: user?.id || ""
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create hall");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHall = (id) => {
    console.log("Id in handle view hall : ", id);
    navigate(`/moderator/adm/view-hall/${id}`);
  };

  const handleEditHall = (hall) => {
    setSelectedHallForEdit(hall);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedHall) => {
    console.log("Hall updated successfully:", updatedHall);
    // The query will automatically refetch due to invalidation in EditHall component
  };

  const handleLocationSelect = (location) => {
    setHallForm((prev) => ({
      ...prev,
      location,
    }));
    setIsLocationPickerOpen(false);
  };

  const handleDeleteHall = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/halls/deleteHall/${id}`);
      toast.success("Hall deleted successfully!");
      await queryClient.invalidateQueries({ queryKey: ['hallData'] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete hall");
    }
  };

  const handleStatusClick = (hall) => {
    if (hall.status === 'booked') {
      toast.error("Cannot change status of a booked hall");
      return;
    }
    setSelectedHallForStatus(hall);
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedHallForStatus) return;

    setIsUpdatingStatus(true);
    try {
      const newStatus = selectedHallForStatus.status === 'active' ? 'inactive' : 'active';
      
      await axios.put(`${BASE_URL}/api/halls/updateStatus/${selectedHallForStatus.id}`, {
        status: newStatus
      });
      
      toast.success(`Hall status updated to ${newStatus} successfully!`);
      await queryClient.invalidateQueries({ queryKey: ['hallData'] });
      
      setIsStatusModalOpen(false);
      setSelectedHallForStatus(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update hall status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!user) return <MeetzSpinner />;
  if (isLoading) return <MeetzSpinner />;
  if (isError) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-500 font-medium text-lg">{error.message}</p>
      </div>
    </div>
  );

  // Add null check for data
  if (!data) return <MeetzSpinner />;

  const hallsData = data.result;
  const hallList = Array.isArray(hallsData) ? hallsData : [];
  console.log("Hall List : ", hallList);

  // Filter halls based on search term
  const filteredHalls = hallList?.filter(hall =>
    hall.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.area_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                Hall Management
              </h1>
              <p className="text-gray-600 mt-2">Create and manage event halls and their configurations</p>
            </div>
            <button
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              <Plus className="w-5 h-5" />
              {isCreateOpen ? "Close Form" : "Create Hall"}
            </button>
          </div>
        </div>

        {/* Create Hall Form */}
        {isCreateOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Create New Hall
              </h2>
              <p className="text-gray-600 mt-1">Fill in the details below to create a new hall</p>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Hall Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={hallForm.name}
                    onChange={(e) => setHallForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter hall name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="area_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Area Name *
                  </label>
                  <input
                    id="area_name"
                    type="text"
                    value={hallForm.area_name}
                    onChange={(e) => setHallForm((prev) => ({ ...prev, area_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter area name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <button
                    type="button"
                    onClick={() => setIsLocationPickerOpen(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <MapPin className="w-4 h-4" />
                    {hallForm.location.lat === 0 && hallForm.location.lng === 0
                      ? "Select Location"
                      : `Lat: ${hallForm.location.lat.toFixed(4)}, Lng: ${hallForm.location.lng.toFixed(4)}`}
                  </button>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    id="city"
                    type="text"
                    value={hallForm.city}
                    onChange={(e) => setHallForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter city name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    id="state"
                    type="text"
                    value={hallForm.state}
                    onChange={(e) => setHallForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter state name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    id="pincode"
                    type="text"
                    pattern="[0-9]{6}"
                    title="Pincode must be a 6-digit number"
                    value={hallForm.pincode}
                    onChange={(e) => setHallForm((prev) => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="totalScreens" className="block text-sm font-medium text-gray-700 mb-2">Number of Screens *</label>
                  <input
                    id="totalScreens"
                    type="number"
                    min={1}
                    placeholder="Enter number of screens"
                    value={hallForm.totalScreens === 0 ? '' : hallForm.totalScreens}
                    onChange={(e) =>
                      setHallForm((prev) => ({
                        ...prev,
                        totalScreens: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Hall
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Location Picker Modal */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search halls by name, city, state, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredHalls.length} of {hallList.length} halls</span>
            </div>
          </div>
        </div>

        {/* Halls Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredHalls.length === 0 ? (
            <div className="p-12 text-center">
              {searchTerm ? (
                <>
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No halls found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your search terms or create a new hall.</p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No halls found</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first hall.</p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Hall
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hall Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Screens
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredHalls.map((hall) => (
                    <tr key={hall.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{hall.name}</p>
                              <p className="text-sm text-gray-500">{hall.area_name || 'No area specified'}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-900">{hall.city}, {hall.state}</p>
                            <p className="text-sm text-gray-500">{hall.pincode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Monitor className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{hall.totalScreens?.length || 0} screens</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewHall(hall.id)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditHall(hall)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                            title="Edit Hall"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHall(hall.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Hall"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleStatusClick(hall)}
                            disabled={hall.status === 'booked'}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              hall.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                : hall.status === 'inactive'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-800 cursor-not-allowed'
                            } ${hall.status === 'booked' ? 'opacity-50' : ''}`}
                            title={
                              hall.status === 'booked'
                                ? 'Cannot change status of booked hall'
                                : `Click to change status to ${hall.status === 'active' ? 'inactive' : 'active'}`
                            }
                          >
                            {hall.status === 'active' && 'Active'}
                            {hall.status === 'inactive' && 'Inactive'}
                            {hall.status === 'booked' && 'Booked'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Hall Modal */}
      {selectedHallForEdit && (
        <EditHall
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedHallForEdit(null);
          }}
          hallData={selectedHallForEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Status Update Confirmation Modal */}
      {isStatusModalOpen && selectedHallForStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Update Hall Status
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to change the status of <strong>{selectedHallForStatus.name}</strong> from{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedHallForStatus.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedHallForStatus.status}
                </span>{' '}
                to{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedHallForStatus.status === 'active' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedHallForStatus.status === 'active' ? 'inactive' : 'active'}
                </span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedHallForStatus(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isUpdatingStatus
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};