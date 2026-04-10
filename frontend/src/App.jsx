import { Route, BrowserRouter as Router, Routes, useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { HomePage } from './pages/home/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { Toaster } from 'react-hot-toast'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { MobileAuth } from './pages/auth/MobileAuth'
import { ModalProvider, useModal } from './context/ModalContext'
import { AuthProvider } from './context/AuthContext'
import { Sidebar } from './components/Home/Sidebar'
import { OTP } from './pages/auth/OTP'
import { AuthSuccess } from './pages/auth/AuthSuccess'
import { OrganiserLoginPage } from './pages/org-auth/OrgLogin'
import { OrganiserRegisterPage } from './pages/org-auth/OrgRegister'
import { OrganiserOtpVerifyPage } from './pages/org-auth/OrgOTP'
import { ProtectedRoute } from './pages/org-pages/ProtectedRoute'
import { ProtectedOrganiserLayout } from './layout/ProtectedOrgLayout'
import { OrganiserDashboard } from './pages/org-pages/Dashboard'
import { AuthError } from './pages/org-auth/AuthError'
import { AdminLoginPage } from './pages/admin-auth/AdminLogin'
import { InviteQRPage } from './pages/admin-auth/InviteQR'
import { AdminRoute } from './pages/admin-auth/AdminRoute'
import { AdminLayout } from './layout/AdminLayout'
import { AdminDashboard } from './pages/admin/Dashboard'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InviteAdmin } from './pages/admin/InviteAdmin'
import { CreateEvent } from './pages/org-pages/CreateEvent'
import { TermsAndConditions } from './components/Other/Terms&Condition'
import { OrganiserManagement } from './pages/admin/Organiser-Manag'
import { EventManagement } from './pages/admin/Event-Manag'
import { HallManagement } from './pages/admin/Hall-Manag'
import { ViewHall } from './pages/admin/ViewHall'
import SeatStructure from './pages/admin/SeatStructure'
import MyEvents from './pages/org-pages/Events'
import EventPage from './pages/org-pages/EventPage'
import LocationProvider from './components/Home/LocationProvider'
import EventInfo from './pages/home/EventInfo';
import OpenZonesSelect from './pages/home/OpenZonesSelect';
import BookingSummary from './pages/home/BookingSummary';
import RegisterParticipants from './pages/home/RegisterParticipants';
import SuccessfulPayment from './pages/home/SuccessfulPayment';
import PaymentFailure from './pages/home/PaymentFailure';
import { YourOrders } from './pages/home/YourOrders';
import OrderDetails from './pages/home/OrderDetails';
import Analytics from './pages/org-pages/Analytics'
import AnalyticsDetails from './pages/org-pages/AnalyticsDetails'
import ScanQR from './pages/org-pages/ScanQR'
import ReportIssue from './pages/home/ReportIssue'
import Support from './pages/admin/Support'
import IssueDetails from './pages/admin/IssueDetails'
import CategorySelect from './pages/home/CategorySelect'
import Financials from './pages/admin/Financials'
import PayoutDetails from './pages/admin/PayoutDetails'
import IncomeReceipts from './pages/org-pages/IncomeReceipts'
import ReceiptDetails from './pages/org-pages/ReceiptDetails'
import Notifications from './pages/home/Notifications'
import PrivacyPolicy from './pages/home/PrivacyPolicy'

const LoginPageRoute = () => {
  const { showLoginModal } = useModal();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    showLoginModal(redirect);
    // Redirect to home page to clean up URL
    navigate('/', { replace: true });
  }, [showLoginModal, searchParams, navigate]);
  
  return <HomePage />;
};

const AppContent = () => {
  const { modalType, isSidebarOpen } = useModal();

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {/* {showLoginModal && <LoginPage />} This renders modal conditionally */}
      {modalType === "login" && <LoginPage />}
      {modalType === "register" && <RegisterPage />}
      {modalType === "otp" && <OTP />}
      {isSidebarOpen && <Sidebar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPageRoute />} />
        <Route path="/event/:eventId" element={<EventInfo />} />
        <Route path="/register-participants/:eventId" element={<RegisterParticipants />} />
        <Route path="/forgot-pswd" element={<ForgotPassword />} />
        <Route path="/mobile-auth" element={<MobileAuth />} />
        <Route path='/auth-success' element={<AuthSuccess />} />
        <Route path='/org-login' element={<OrganiserLoginPage />} />
        <Route path='/org-register' element={<OrganiserRegisterPage />} />
        <Route path='/org-verify-otp' element={<OrganiserOtpVerifyPage />} />
        <Route path="/auth-error" element={<AuthError />} />
        <Route path='/admin/login' element={<AdminLoginPage />} />
        <Route path='/admin/invite/:email/:token' element={<InviteQRPage />} />
        <Route path='/terms' element={<TermsAndConditions/>} />
        <Route path="/book/s/:eventId" element={<SeatStructure />} />
        <Route path="/book/open/:eventId" element={<OpenZonesSelect />} />
        <Route path="/booking-summary/:id" element={<BookingSummary />} />
        <Route path="/payment-success" element={<SuccessfulPayment />} /> 
        <Route path="/payment-failure" element={<PaymentFailure />} />
        <Route path='/your-orders' element={<YourOrders />} />
        <Route path='/order-details/:orderId' element={<OrderDetails />} />
        <Route path='report-issue' element={<ReportIssue/>} />
        <Route path='category/:subtype' element={<CategorySelect />} />
        <Route path='notifications' element={<Notifications />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />

        {/* Protected Organiser Routes */}
        <Route
          path="organiser"
          element={
            <ProtectedRoute>
              <ProtectedOrganiserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<OrganiserDashboard />} />
          <Route path='create-event' element={<CreateEvent/>} />
          <Route path='events' element={<MyEvents/>} />
          <Route path='event-details/:eventId' element={<EventPage/>} />
          <Route path='analytics' element={<Analytics/>} />
          <Route path='analytics-details/:eventId' element={<AnalyticsDetails/>} />
          <Route path='scan-qr' element={<ScanQR/>} />
          <Route path='report-issue' element={<ReportIssue/>} />
          <Route path='invoice' element={<IncomeReceipts/>} />
          <Route path='receipt/:id' element={<ReceiptDetails />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          path="moderator/adm/"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute> 
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="organizer-management" element={<OrganiserManagement/>} />
          <Route path="event-management" element={<EventManagement/>} />
          <Route path="hall-management" element={<HallManagement/>} />
          <Route path="view-hall/:hallId" element={<ViewHall/>} />
          <Route path="seat-structure/:screenId/:screenNo/:eventId/:eventName" element={<SeatStructure />} />
          <Route path="invite-admin" element={<InviteAdmin />} />
          <Route path="support" element={<Support />} />
          <Route path="support/issue/:id" element={<IssueDetails />} />
          <Route path='financials' element={<Financials />} />
          <Route path='payout/:id' element={<PayoutDetails />} />
          
        </Route>

      </Routes>
    </>
  );
};

export const App = () => {

  const queryClient = new QueryClient();
  // Optimization step : Wrap all the context provider in a single providers component and use it below

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <ModalProvider>
            <Router>
              <AppContent />
            </Router>
          </ModalProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};