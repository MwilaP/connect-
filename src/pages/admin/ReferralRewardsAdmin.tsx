import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { CheckCircle, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import type { ReferralReward } from '../../../lib/types/referral';

interface RewardWithDetails extends ReferralReward {
  referrer_email?: string;
  referred_email?: string;
}

export default function ReferralRewardsAdmin() {
  const [rewards, setRewards] = useState<RewardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [stats, setStats] = useState({
    total_pending: 0,
    total_paid: 0,
    pending_amount: 0,
    paid_amount: 0,
  });
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchRewards();
    fetchStats();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      
      // Fetch rewards with referrer and referred user details
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select(`
          *,
          referral:referrals (
            referrer_id,
            referred_user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (rewardsError) throw rewardsError;

      // Fetch user emails for each reward
      const rewardsWithDetails = await Promise.all(
        (rewardsData || []).map(async (reward: any) => {
          const referrerId = reward.referral?.referrer_id;
          const referredId = reward.referral?.referred_user_id;

          let referrerEmail = 'Unknown';
          let referredEmail = 'Unknown';

          if (referrerId) {
            const { data: referrerData } = await supabase.auth.admin.getUserById(referrerId);
            referrerEmail = referrerData?.user?.email || 'Unknown';
          }

          if (referredId) {
            const { data: referredData } = await supabase.auth.admin.getUserById(referredId);
            referredEmail = referredData?.user?.email || 'Unknown';
          }

          return {
            ...reward,
            referrer_email: referrerEmail,
            referred_email: referredEmail,
          };
        })
      );

      setRewards(rewardsWithDetails);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allRewards, error } = await supabase
        .from('referral_rewards')
        .select('amount, status');

      if (error) throw error;

      const stats = (allRewards || []).reduce(
        (acc, reward) => {
          if (reward.status === 'pending') {
            acc.total_pending++;
            acc.pending_amount += Number(reward.amount);
          } else if (reward.status === 'paid') {
            acc.total_paid++;
            acc.paid_amount += Number(reward.amount);
          }
          return acc;
        },
        { total_pending: 0, total_paid: 0, pending_amount: 0, paid_amount: 0 }
      );

      setStats(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedReward || !paymentReference.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a payment reference',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('mark_reward_as_paid', {
        p_reward_id: selectedReward.id,
        p_payment_method: paymentMethod,
        p_payment_reference: paymentReference,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reward marked as paid successfully',
      });

      setShowPaymentDialog(false);
      setSelectedReward(null);
      setPaymentReference('');
      fetchRewards();
      fetchStats();
    } catch (err) {
      console.error('Error marking reward as paid:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark reward as paid',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentDialog = (reward: RewardWithDetails) => {
    setSelectedReward(reward);
    setShowPaymentDialog(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pendingRewards = rewards.filter((r) => r.status === 'pending');
  const paidRewards = rewards.filter((r) => r.status === 'paid');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Rewards Management</h1>
        <p className="text-muted-foreground">
          Manage and process referral reward payments
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending_amount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Rewards</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_paid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paid_amount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pending_amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">To be paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.paid_amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Already paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rewards */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Pending Rewards ({pendingRewards.length})
          </CardTitle>
          <CardDescription>
            Rewards waiting to be processed and paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRewards.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending rewards</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {reward.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="bg-orange-50">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Referrer:</strong> {reward.referrer_email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Referred:</strong> {reward.referred_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(reward.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button onClick={() => openPaymentDialog(reward)}>
                    Mark as Paid
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Paid Rewards ({paidRewards.length})
          </CardTitle>
          <CardDescription>
            Rewards that have been successfully paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paidRewards.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No paid rewards yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paidRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {reward.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="bg-green-100">
                        Paid
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Referrer:</strong> {reward.referrer_email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Referred:</strong> {reward.referred_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid: {reward.paid_at ? new Date(reward.paid_at).toLocaleDateString() : 'N/A'}
                      {reward.payment_method && ` via ${reward.payment_method}`}
                    </p>
                    {reward.payment_reference && (
                      <p className="text-xs text-muted-foreground">
                        Reference: {reward.payment_reference}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Reward as Paid</DialogTitle>
            <DialogDescription>
              Enter payment details to mark this reward as paid
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>Amount:</strong> {selectedReward.amount.toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Referrer:</strong> {selectedReward.referrer_email}
                </p>
                <p className="text-sm">
                  <strong>Referred:</strong> {selectedReward.referred_email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference</Label>
                <Input
                  id="payment-reference"
                  placeholder="Enter transaction reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedReward(null);
                setPaymentReference('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
