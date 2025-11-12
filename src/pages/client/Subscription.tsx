import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../SupabaseContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { PaymentModal } from '../../components/PaymentModal';
import { Crown, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useSupabase();
  const { subscriptionStatus, subscribe, cancelSubscription, loading } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/client/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="mt-2 text-muted-foreground">Manage your premium membership</p>
        </div>

        {/* Current Subscription Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-600">Active Premium</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-600">Free Plan</span>
                  </>
                )}
              </div>

              {/* Subscription Details */}
              {isActive && subscription ? (
                <div className="space-y-3 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">Monthly Premium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-medium">K100/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renewal Date</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {renewalDate}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Limited Access</p>
                      <p className="text-sm text-muted-foreground">
                        You have {subscriptionStatus.dailyViewsLimit - subscriptionStatus.dailyViewsCount} of{' '}
                        {subscriptionStatus.dailyViewsLimit} free profile views remaining today.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premium Benefits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Premium Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Unlimited Profile Views</p>
                  <p className="text-sm text-muted-foreground">
                    Browse as many provider profiles as you want, no daily limits
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Unblurred Photos</p>
                  <p className="text-sm text-muted-foreground">
                    View all provider photos and galleries in full quality
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">
                    Get faster responses from our customer support team
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Save Favorites</p>
                  <p className="text-sm text-muted-foreground">
                    Bookmark your favorite providers for quick access
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isActive ? (
            <>
              {!showCancelConfirm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button>
              ) : (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium">Are you sure?</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            You'll lose access to premium features at the end of your billing period ({renewalDate}).
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowCancelConfirm(false)}
                        >
                          Keep Subscription
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
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
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium - K100/month
            </Button>
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
    </div>
  );
}
