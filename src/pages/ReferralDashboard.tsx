import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useReferral } from '../hooks/use-referral';
import { useToast } from '../../hooks/use-toast';
import { PageLoader } from '../components/PageLoader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Copy, Share2, Users, DollarSign, TrendingUp, CheckCircle, Clock, Gift, Menu } from 'lucide-react';
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
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
  } = useReferral();
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-xl font-semibold">
              ConnectPro
            </Link>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" disabled>
                Loading...
              </Button>
            </nav>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-lg sm:text-xl font-semibold">
            ConnectPro
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={user?.user_metadata?.role === 'provider' ? '/provider/profile' : '/client/profile'}>
                My Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/browse">Browse</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to={user?.user_metadata?.role === 'provider' ? '/provider/profile' : '/client/profile'}>
                  My Profile
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/referrals">Referrals</Link>
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Earn 20,000 for every friend who subscribes using your referral link!
        </p>
      </div>

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
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_earnings?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
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

      {/* Tabs for Referrals and Rewards */}
      <Tabs defaultValue="referrals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
          <TabsTrigger value="rewards">My Rewards</TabsTrigger>
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
      </Tabs>
      </div>
    </div>
  );
}
