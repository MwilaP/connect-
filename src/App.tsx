import { Routes, Route, Navigate } from 'react-router-dom'
import { useSupabase } from './contexts/SupabaseContext'

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

function App() {
  const { user, loading } = useSupabase()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
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
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
