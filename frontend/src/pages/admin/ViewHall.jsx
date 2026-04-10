import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MeetzSpinner } from '../../components/Other/Spinner';
import { EditHall } from './EditHall';
import { 
  MapPin, 
  Building2, 
  Monitor, 
  Users, 
  Edit3, 
  Plus,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Image
} from 'lucide-react';
import { useState } from 'react';
import SeatLayoutBuilder from '../org-pages/SeatLayoutBuilder';
import { useNavigate } from 'react-router-dom';
import EditSeatLayout from '../../components/Other/EditSeatLayout';
import { toast } from 'react-hot-toast';

export const ViewHall = () => {
  const { hallId } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [seatBuilderOpen, setSeatBuilderOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [editLayoutOpen, setEditLayoutOpen] = useState(false);
  const [isScreenStatusModalOpen, setIsScreenStatusModalOpen] = useState(false);
  const [selectedScreenForStatus, setSelectedScreenForStatus] = useState(null);
  const [isUpdatingScreenStatus, setIsUpdatingScreenStatus] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  console.log("Hall ID : ", hallId);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchHall = async (id) => {
    const response = await axios.get(`${BASE_URL}/api/halls/getHall/${id}`);
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: () => fetchHall(hallId),
    enabled: !!hallId,
  });

  if (isLoading) return <MeetzSpinner />;
  if (isError) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 font-medium text-lg">{error.message}</p>
      </div>
    </div>
  );

  console.log("Data : ", data);
  const hall = data.hallData[0] || {};
  console.log("Hall : ", hall);
  const screens = Array.isArray(data.screenData) ? data.screenData : [];
  console.log("Screens : ", screens);

  const getBookingStatusColor = (bookedSeats, totalSeats) => {
    const percentage = (bookedSeats / totalSeats) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getBookingStatusIcon = (bookedSeats, totalSeats) => {
    const percentage = (bookedSeats / totalSeats) * 100;
    if (percentage >= 90) return <AlertCircle className="w-4 h-4" />;
    if (percentage >= 70) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const handleEditSuccess = (updatedHall) => {
    console.log("Hall updated successfully:", updatedHall);
    // The query will automatically refetch due to invalidation in EditHall component
  };

  const handleScreenStatusClick = (screen) => {
    if (screen.status === 'booked') {
      toast.error("Cannot change status of a booked screen");
      return;
    }
    setSelectedScreenForStatus(screen);
    setIsScreenStatusModalOpen(true);
  };

  const handleScreenStatusUpdate = async () => {
    if (!selectedScreenForStatus) return;

    setIsUpdatingScreenStatus(true);
    try {
      const newStatus = selectedScreenForStatus.status === 'active' ? 'inactive' : 'active';
      
      await axios.put(`${BASE_URL}/api/halls/updateScreenStatus/${selectedScreenForStatus.id}`, {
        status: newStatus
      });
      
      toast.success(`Screen status updated to ${newStatus} successfully!`);
      await queryClient.invalidateQueries({ queryKey: ['hall', hallId] });
      
      setIsScreenStatusModalOpen(false);
      setSelectedScreenForStatus(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update screen status");
    } finally {
      setIsUpdatingScreenStatus(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                {hall.name || 'Hall Details'}
              </h1>
              <p className="text-gray-600 mt-2">Manage hall information and screen configurations</p>
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Hall
            </button>
          </div>
        </div>

        {/* Hall Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Screens</p>
                <p className="text-2xl font-bold text-gray-900">{hall.totalScreens?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">City</p>
                <p className="text-2xl font-bold text-gray-900">{hall.city || 'N/A'}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">State</p>
                <p className="text-2xl font-bold text-gray-900">{hall.state || 'N/A'}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pincode</p>
                <p className="text-2xl font-bold text-gray-900">{hall.pincode || 'N/A'}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Area Name */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Area Name</p>
                <p className="text-2xl font-bold text-gray-900">{hall.area_name || 'N/A'}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Location Information */}
          {hall.latitude && hall.longitude && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Location Coordinates
                </h3>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Latitude</p>
                  <p className="text-lg font-semibold text-gray-900">{hall.latitude}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Longitude</p>
                  <p className="text-lg font-semibold text-gray-900">{hall.longitude}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Screens Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                Screens ({screens.length})
              </h2>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={async () => {
                  if (window.confirm('Add a new screen to this hall?')) {
                    try {
                      await axios.post(`${BASE_URL}/api/halls/addScreenToHall`, { hallId });
                      toast.success('Screen added successfully!');
                      window.location.reload();
                    } catch (err) {
                      toast.error('Failed to add screen');
                    }
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Add Screen
              </button>
            </div>
          </div>

          {screens.length === 0 ? (
            <div className="p-12 text-center">
              <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No screens found</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first screen to this hall.</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors">
                <Plus className="w-4 h-4" />
                Create First Screen
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Screen #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Seats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booked Seats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Screen Layout
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {screens.map((screen, index) => {
                    const availabilityPercentage = ((screen.seats - screen.bookedSeats) / screen.seats) * 100;
                    const bookingStatusColor = getBookingStatusColor(screen.bookedSeats, screen.seats);
                    const bookingStatusIcon = getBookingStatusIcon(screen.bookedSeats, screen.seats);
                    
                    return (
                      <tr key={screen.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              {/* <span className="text-sm font-semibold text-blue-600">{screen.id}</span> */}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Screen {screen.screen_no}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{screen.totalSeats}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{screen.bookedSeats}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${availabilityPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{Math.round(availabilityPercentage)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bookingStatusColor}`}>
                            {bookingStatusIcon}
                            <span className="ml-1">
                              {screen.bookedSeats < screen.seats ? "Available" : "Fully Booked"}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => console.log("View screen", screen.id)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log("Edit seats for", screen.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded transition-colors cursor-pointer"
                              title="Edit Seats"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this screen? This will remove all seats and cannot be undone.')) {
                                  try {
                                    await axios.delete(`${BASE_URL}/api/halls/deleteScreen/${screen.id}`);
                                    toast.success('Screen deleted successfully!');
                                    // Refetch hall/screens
                                    window.location.reload();
                                  } catch (err) {
                                    toast.error('Failed to delete screen');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors cursor-pointer"
                              title="Delete Screen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {screen.isSeatAlloted ? (
                              <>
                                <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                                  title="View Seats"
                                  onClick={() => navigate(`/moderator/adm/seat-structure/${screen.id}/${screen.screen_no}`)}
                                >
                                  <Image className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                                  title="Edit Layout"
                                  onClick={() => { setSelectedScreen(screen); setEditLayoutOpen(true); }}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-all duration-200 cursor-pointer"
                                title="Allocate Seats"
                                onClick={() => { setSelectedScreen(screen); setSeatBuilderOpen(true); }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Allocate</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleScreenStatusClick(screen)}
                            disabled={screen.status === 'booked'}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              screen.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                : screen.status === 'inactive'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-800 cursor-not-allowed'
                            } ${screen.status === 'booked' ? 'opacity-50' : ''}`}
                            title={
                              screen.status === 'booked'
                                ? 'Cannot change status of booked screen'
                                : `Click to change status to ${screen.status === 'active' ? 'inactive' : 'active'}`
                            }
                          >
                            {screen.status === 'active' && 'Active'}
                            {screen.status === 'inactive' && 'Inactive'}
                            {screen.status === 'booked' && 'Booked'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Future Seat Layout Section */}
        {/* <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Seat Layout Preview
          </h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Seat Layout</h3>
            <p className="text-gray-500 mb-4">
              Visual seat layout and management interface will be available here.
            </p>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
              Coming Soon
            </button>
          </div>
        </div> */}
      </div>

      {/* Edit Hall Modal */}
      <EditHall
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        hallData={hall}
        onSuccess={handleEditSuccess}
      />

      {/* Seat Layout Builder Modal */}
      {seatBuilderOpen && selectedScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-4xl w-full max-h-[80vh] overflow-y-auto mt-8">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setSeatBuilderOpen(false)}
            >
              &times;
            </button>
            <SeatLayoutBuilder hallID={hall.id} screenID={selectedScreen.id} />
          </div>
        </div>
      )}

      {/* Edit Seat Layout Modal */}
      {editLayoutOpen && selectedScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-4xl w-full max-h-[80vh] overflow-y-auto mt-8">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setEditLayoutOpen(false)}
            >
              &times;
            </button>
            <EditSeatLayout screenID={selectedScreen.id} hallID={hallId} onClose={() => setEditLayoutOpen(false)} />
          </div>
        </div>
      )}

      {/* Screen Status Update Confirmation Modal */}
      {isScreenStatusModalOpen && selectedScreenForStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Update Screen Status
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to change the status of <strong>Screen {selectedScreenForStatus.screen_no}</strong> from{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedScreenForStatus.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedScreenForStatus.status}
                </span>{' '}
                to{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedScreenForStatus.status === 'active' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedScreenForStatus.status === 'active' ? 'inactive' : 'active'}
                </span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsScreenStatusModalOpen(false);
                    setSelectedScreenForStatus(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isUpdatingScreenStatus}
                >
                  Cancel
                </button>
                <button
                  onClick={handleScreenStatusUpdate}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isUpdatingScreenStatus
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={isUpdatingScreenStatus}
                >
                  {isUpdatingScreenStatus ? (
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