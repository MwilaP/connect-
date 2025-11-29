import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useReferral } from '../hooks/use-referral';
import { useToast } from '../../hooks/use-toast';
import { PageLoader } from '../components/PageLoader';
import { ReferralAccessPaymentModal } from '../components/ReferralAccessPaymentModal';
import { WithdrawalRequestModal } from '../components/WithdrawalRequestModal';
import { WithdrawalHistory } from '../components/WithdrawalHistory';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Copy, Share2, Users, DollarSign, TrendingUp, CheckCircle, Clock, Gift, Lock, CreditCard, Crown } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function ReferralDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useSupabase();
  const {
    referralCode,
    stats,
    referrals,
    rewards,
    loading,
    error,
    access,
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
    refresh,
  } = useReferral();
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasProviderProfile, setHasProviderProfile] = useState(false);
  const [hasClientProfile, setHasClientProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const handleCopy = async () => {
    setCopying(true);
    const success = await copyReferralLink();
    if (success) {
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
    setCopying(false);
  };

  const handleShare = async () => {
    setSharing(true);
    const success = await shareReferralLink();
    if (success) {
      toast({
        title: 'Shared!',
        description: 'Referral link shared successfully',
      });
    }
    setSharing(false);
  };

  // Get user role and profile info
  useState(() => {
    if (user) {
      const role = user.user_metadata?.role;
      setUserRole(role);
      // For simplicity, assume profiles exist if on referral page
      if (role === 'provider') {
        setHasProviderProfile(true);
      } else if (role === 'client') {
        setHasClientProfile(true);
      }
    }
  });

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
          <PageLoader message="Loading referral dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const referralLink = getReferralLink();

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
              <Link to={user?.user_metadata?.role === 'provider' ? '/provider/profile' : '/client/profile'}>
                My Profile
              </Link>
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

      <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Earn 20,000 for every friend who subscribes using your referral link!
        </p>
      </div>

      {/* Access Restriction Messages */}
      {access && !access.hasAccess && (
        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {user?.user_metadata?.role === 'provider' 
                    ? 'Unlock Referral Program' 
                    : 'Subscribe to Access Referrals'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {access.message}
                </p>
                {user?.user_metadata?.role === 'provider' ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>One-time payment of K30 for lifetime access</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Earn K20,000 for each successful referral</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Unlimited referral link sharing</span>
                    </div>
                    <Button 
                      size="lg" 
                      className="mt-4"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay K30 to Unlock
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Subscribe to unlock the referral program</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Earn K20,000 for each friend who subscribes</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Access available as long as subscription is active</span>
                    </div>
                    <Button 
                      size="lg" 
                      className="mt-4"
                      asChild
                    >
                      <Link to="/client/subscription">
                        <Crown className="mr-2 h-5 w-5" />
                        View Subscription Plans
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Only show referral content if user has access */}
      {access?.hasAccess && (
        <>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending_referrals || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successful_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Subscribed users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_earnings?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ K{((stats?.total_earnings || 0) / 1000).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available to Withdraw</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending_earnings?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card className="mb-8 border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Withdraw Your Earnings
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Convert your points to cash (20,000 points = K20)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {stats?.pending_earnings?.toLocaleString() || 0} pts
                </span>
                <span className="text-muted-foreground">
                  ≈ K{((stats?.pending_earnings || 0) / 1000).toFixed(2)} available
                </span>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setShowWithdrawalModal(true)}
              disabled={!stats?.pending_earnings || stats.pending_earnings < 10000}
              className="w-full md:w-auto"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Withdraw to Mobile Money
            </Button>
          </div>
          {stats && stats.pending_earnings < 10000 && (
            <Alert className="mt-4">
              <AlertDescription className="text-xs">
                Minimum withdrawal is 10,000 points (K10). Keep referring to reach the minimum!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Referral Link Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends to earn rewards when they subscribe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                disabled={copying}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copying ? 'Copying...' : 'Copy'}
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 sm:flex-none"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {sharing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Your Referral Code:</p>
            <p className="text-2xl font-bold tracking-wider">
              {referralCode?.referral_code || 'Loading...'}
            </p>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong> Share your link with friends. When they sign up and
              subscribe to any plan, you'll automatically earn 20,000!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tabs for Referrals, Rewards, and Withdrawals */}
      <Tabs defaultValue="referrals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
          <TabsTrigger value="rewards">My Rewards</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>
                Track the status of people you've referred
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No referrals yet. Start sharing your link to earn rewards!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">Referral #{referral.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Referred on {new Date(referral.referred_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {referral.status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {referral.status === 'subscribed' && (
                          <Badge variant="outline" className="bg-blue-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Subscribed
                          </Badge>
                        )}
                        {referral.status === 'rewarded' && (
                          <Badge variant="outline" className="bg-green-50">
                            <Gift className="h-3 w-3 mr-1" />
                            Rewarded
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reward History</CardTitle>
              <CardDescription>
                View your earned rewards and payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No rewards yet. Keep sharing to earn!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-lg">
                          {reward.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created on {new Date(reward.created_at).toLocaleDateString()}
                        </p>
                        {reward.paid_at && (
                          <p className="text-sm text-green-600">
                            Paid on {new Date(reward.paid_at).toLocaleDateString()}
                            {reward.payment_method && ` via ${reward.payment_method}`}
                          </p>
                        )}
                      </div>
                      <div>
                        {reward.status === 'pending' && (
                          <Badge variant="outline" className="bg-orange-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {reward.status === 'paid' && (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                        {reward.status === 'cancelled' && (
                          <Badge variant="outline" className="bg-red-50">
                            Cancelled
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stats && stats.paid_earnings > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Paid</p>
                      <p className="text-2xl font-bold text-green-700">
                        {stats.paid_earnings.toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6">
          <WithdrawalHistory />
        </TabsContent>
      </Tabs>
      </>
      )}
      </div>

      {/* Payment Modal */}
      <ReferralAccessPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          refresh();
          toast({
            title: 'Success!',
            description: 'You now have access to the referral program',
          });
        }}
      />

      {/* Withdrawal Modal */}
      <WithdrawalRequestModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={() => {
          refresh();
          toast({
            title: 'Withdrawal Requested!',
            description: 'Your withdrawal will be processed within 24-48 hours',
          });
        }}
      />
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav
        userRole={userRole}
        hasProviderProfile={hasProviderProfile}
        hasClientProfile={hasClientProfile}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
