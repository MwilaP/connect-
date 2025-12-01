import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '../../../lib/supabase/client';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useSubscription } from '../../hooks/useSubscription';
import { PageLoader } from '../../components/PageLoader';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { PaymentModal } from '../../components/PaymentModal';
import { Crown, Calendar, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useSupabase();
  const { subscriptionStatus, subscribe, cancelSubscription, loading } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasProviderProfile, setHasProviderProfile] = useState(false);
  const [hasClientProfile, setHasClientProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const handleCancel = async () => {
    const success = await cancelSubscription();
    if (success) {
      setShowCancelConfirm(false);
    }
  };

  // Get user role and profile info
  useEffect(() => {
    async function fetchProfiles() {
      if (user) {
        const role = user.user_metadata?.role;
        setUserRole(role);
        
        const supabase = createClient();
        
        if (role === 'provider') {
          const { data } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          setHasProviderProfile(!!data);
        } else if (role === 'client') {
          const { data } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          setHasClientProfile(!!data);
        }
      }
    }
    fetchProfiles();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto flex h-14 sm:h-20 items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-primary-foreground">C</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ConnectPro
              </h1>
            </Link>
          </div>
        </header>
        <div className="container mx-auto py-8 px-4">
          <PageLoader message="Loading subscription..." />
        </div>
      </div>
    );
  }

  const subscription = subscriptionStatus.subscription;
  const isActive = subscriptionStatus.hasActiveSubscription;
  const renewalDate = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Simplified Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-14 sm:h-20 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ConnectPro
            </h1>
          </Link>
          
          {/* Desktop Navigation Only */}
          <nav className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/client/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="outline" size="sm" className="touch-target" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Subscription</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Manage your premium membership</p>
        </div>

        {/* Current Subscription Status */}
        <Card className="mb-6 sm:mb-8 overflow-hidden">
          {isActive && (
            <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
          )}
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2 sm:gap-3">
                {isActive ? (
                  <>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                      <span className="font-semibold text-base sm:text-lg text-green-600 dark:text-green-500">Active Premium</span>
                      <p className="text-xs sm:text-sm text-muted-foreground">Unlimited access</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-semibold text-base sm:text-lg text-muted-foreground">Free Plan</span>
                      <p className="text-xs sm:text-sm text-muted-foreground">Limited access</p>
                    </div>
                  </>
                )}
              </div>

              {/* Subscription Details */}
              {isActive && subscription ? (
                <div className="space-y-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6 border border-primary/20">
                  <div className="flex items-center justify-between py-2 border-b border-primary/10">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-semibold text-sm sm:text-base">Monthly Premium</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-primary/10">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-semibold text-sm sm:text-base">K100/month</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Renewal Date</span>
                    <span className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {renewalDate}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 p-4 sm:p-6 border-2 border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base mb-1.5">Limited Access</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        You have <span className="font-semibold text-amber-700 dark:text-amber-400">{subscriptionStatus.dailyViewsLimit - subscriptionStatus.dailyViewsCount} of{' '}
                        {subscriptionStatus.dailyViewsLimit}</span> free profile views remaining today.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premium Benefits */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              Premium Benefits
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Everything you get with a premium subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base mb-1">Unlimited Profile Views</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Browse as many provider profiles as you want, no daily limits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base mb-1">Unblurred Photos</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    View all provider photos and galleries in full quality
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base mb-1">Priority Support</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Get faster responses from our customer support team
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base mb-1">Save Favorites</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Bookmark your favorite providers for quick access
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isActive ? (
            <>
              {!showCancelConfirm ? (
                <Button
                  variant="outline"
                  className="w-full touch-target"
                  size="lg"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button>
              ) : (
                <Card className="border-2 border-destructive">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base mb-1">Are you sure?</p>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            You'll lose access to premium features at the end of your billing period ({renewalDate}).
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 touch-target"
                          size="lg"
                          onClick={() => setShowCancelConfirm(false)}
                        >
                          Keep Subscription
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 touch-target"
                          size="lg"
                          onClick={handleCancel}
                        >
                          Confirm Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center mb-2">
                    <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Upgrade to Premium</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Get unlimited access to all features for just K100/month
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg touch-target"
                    size="lg"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Subscribe Now - K100/month
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={100}
        purpose="subscription"
        onSuccess={async (paymentMethod) => {
          const success = await subscribe(paymentMethod);
          if (success) {
            setShowPaymentModal(false);
          }
          return success;
        }}
      />
      
      {/* Bottom Navigation for Mobile */}
      {user && (
        <BottomNav
          userRole={userRole}
          hasProviderProfile={hasProviderProfile}
          hasClientProfile={hasClientProfile}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
