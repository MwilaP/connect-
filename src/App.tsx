import { Routes, Route, Navigate } from 'react-router-dom'
import { useSupabase } from './contexts/SupabaseContext'
import { LoadingScreen } from './components/LoadingScreen'
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Error from './pages/auth/Error'
import SignupSuccess from './pages/auth/SignupSuccess'

// Main Pages
import Home from './pages/Home'

// Browse Pages
import BrowseList from './pages/browse/BrowseList'
import ProviderDetail from './pages/browse/ProviderDetail'

// Client Pages
import ClientProfile from './pages/client/Profile'
import NewClientProfile from './pages/client/NewProfile'
import EditClientProfile from './pages/client/EditProfile'
import ClientSubscription from './pages/client/Subscription'

// Provider Pages
import ProviderProfile from './pages/provider/Profile'
import NewProviderProfile from './pages/provider/NewProfile'
import EditProviderProfile from './pages/provider/EditProfile'
import ProviderDashboard from './pages/provider/Dashboard'

// Referral Pages
import ReferralDashboard from './pages/ReferralDashboard'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import UsersManagement from './pages/admin/UsersManagement'
import ProvidersManagement from './pages/admin/ProvidersManagement'
import SubscriptionsManagement from './pages/admin/SubscriptionsManagement'
import PaymentsManagement from './pages/admin/PaymentsManagement'
import WithdrawalsManagement from './pages/admin/WithdrawalsManagement'
import ReferralRewardsAdmin from './pages/admin/ReferralRewardsAdmin'

function App() {
  const { user, loading: userLoading } = useSupabase()

  // Only wait for user authentication, subscription can load in background
  if (userLoading) {
    return <LoadingScreen user={user} message="Loading..." />
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/error" element={<Error />} />
      <Route path="/auth/signup-success" element={<SignupSuccess />} />
      
      {/* Main Routes */}
      <Route path="/" element={<Home user={user} />} />
      
      {/* Browse Routes - Protected (Clients Only) */}
      <Route path="/browse" element={<ProtectedRoute allowedRoles={['client']} redirectTo="/provider/dashboard"><BrowseList /></ProtectedRoute>} />
      <Route path="/browse/:id" element={<ProtectedRoute allowedRoles={['client']} redirectTo="/provider/dashboard"><ProviderDetail /></ProtectedRoute>} />
      
      {/* Client Routes - Protected */}
      <Route path="/client/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
      <Route path="/client/profile/new" element={<ProtectedRoute><NewClientProfile /></ProtectedRoute>} />
      <Route path="/client/profile/edit" element={<ProtectedRoute><EditClientProfile /></ProtectedRoute>} />
      <Route path="/client/subscription" element={<ProtectedRoute><ClientSubscription /></ProtectedRoute>} />
      
      {/* Provider Routes - Protected */}
      <Route path="/provider/dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/provider/profile" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />
      <Route path="/provider/profile/new" element={<ProtectedRoute><NewProviderProfile /></ProtectedRoute>} />
      <Route path="/provider/profile/edit" element={<ProtectedRoute><EditProviderProfile /></ProtectedRoute>} />
      
      {/* Referral Routes - Protected */}
      <Route path="/referrals" element={<ProtectedRoute><ReferralDashboard /></ProtectedRoute>} />
      
      {/* Admin Routes - Protected */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="providers" element={<ProvidersManagement />} />
        <Route path="subscriptions" element={<SubscriptionsManagement />} />
        <Route path="payments" element={<PaymentsManagement />} />
        <Route path="withdrawals" element={<WithdrawalsManagement />} />
        <Route path="referrals" element={<ReferralRewardsAdmin />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
