import { Routes, Route, Navigate } from 'react-router-dom'
import { useSupabase } from './contexts/SupabaseContext'
import { useSubscription } from './hooks/useSubscription'
import { LoadingScreen } from './components/LoadingScreen'

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
  const { loading: subscriptionLoading } = useSubscription()

  // Wait for both user and subscription data to load
  if (userLoading || (user && subscriptionLoading)) {
    return <LoadingScreen user={user} message="Initializing application..." />
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
      
      {/* Browse Routes */}
      <Route path="/browse" element={<BrowseList />} />
      <Route path="/browse/:id" element={<ProviderDetail />} />
      
      {/* Client Routes */}
      <Route path="/client/profile" element={<ClientProfile />} />
      <Route path="/client/profile/new" element={<NewClientProfile />} />
      <Route path="/client/profile/edit" element={<EditClientProfile />} />
      <Route path="/client/subscription" element={<ClientSubscription />} />
      
      {/* Provider Routes */}
      <Route path="/provider/dashboard" element={<ProviderDashboard />} />
      <Route path="/provider/profile" element={<ProviderProfile />} />
      <Route path="/provider/profile/new" element={<NewProviderProfile />} />
      <Route path="/provider/profile/edit" element={<EditProviderProfile />} />
      
      {/* Referral Routes */}
      <Route path="/referrals" element={<ReferralDashboard />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
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
