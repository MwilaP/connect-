import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Wallet, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface WithdrawalBalance {
  total_points: number;
  total_amount: number;
  withdrawn_points: number;
  withdrawn_amount: number;
  pending_points: number;
  pending_amount: number;
  available_points: number;
  available_amount: number;
}

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawalRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: WithdrawalRequestModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [points, setPoints] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_withdrawal_balance', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setBalance(data[0]);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = (pointsValue: string): number => {
    const pts = parseInt(pointsValue) || 0;
    return pts / 1000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const pointsValue = parseInt(points);
      if (isNaN(pointsValue) || pointsValue <= 0) {
        throw new Error('Please enter a valid points amount');
      }

      if (pointsValue < 10000) {
        throw new Error('Minimum withdrawal is 10,000 points (K10)');
      }

      if (balance && pointsValue > balance.available_points) {
        throw new Error(`Insufficient balance. Available: ${balance.available_points.toLocaleString()} points`);
      }

      const { data, error: requestError } = await supabase
        .rpc('create_withdrawal_request', {
          p_user_id: user.id,
          p_points: pointsValue,
          p_payment_method: paymentMethod,
          p_phone_number: phoneNumber,
        });

      if (requestError) throw requestError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Withdrawal request error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setPaymentMethod('');
      setPhoneNumber('');
      setPoints('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription>
            Convert your points to cash and withdraw to mobile money
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading balance...</p>
          </div>
        ) : success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground">
              Your withdrawal request has been submitted and will be processed within 24-48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Balance Display */}
              {balance && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {balance.available_points.toLocaleString()} pts
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ≈ K{balance.available_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {balance.pending_points > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Pending Withdrawal</span>
                      <span className="text-xs font-medium">
                        {balance.pending_points.toLocaleString()} pts (K{balance.pending_amount.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Conversion Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Conversion Rate:</strong> 20,000 points = K20 | 1,000 points = K1
                </AlertDescription>
              </Alert>

              {/* Points to Withdraw */}
              <div className="space-y-2">
                <Label htmlFor="points">Points to Withdraw</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="Enter points (min 10,000)"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min="10000"
                  step="1000"
                  required
                />
                {points && parseInt(points) >= 10000 && (
                  <p className="text-sm text-muted-foreground">
                    ≈ K{calculateAmount(points).toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum: 10,000 points (K10)
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select mobile money provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                    <SelectItem value="mtn_money">MTN Money</SelectItem>
                    <SelectItem value="zamtel_money">Zamtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0977123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Money will be sent to this number
                </p>
              </div>

              {/* Important Notes */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 p-3 space-y-2">
                <p className="text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Important Information</span>
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  <li>• Processing time: 24-48 hours</li>
                  <li>• Minimum withdrawal: K10 (10,000 points)</li>
                  <li>• Ensure phone number is correct</li>
                  <li>• You'll receive an SMS confirmation</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={processing || !paymentMethod || !points || parseInt(points) < 10000}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Withdrawal'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
