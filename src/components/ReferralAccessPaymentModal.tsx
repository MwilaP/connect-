import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { lencoPayService } from '../services/lencopay.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Gift, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';

interface ReferralAccessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReferralAccessPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: ReferralAccessPaymentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState<'mtn' | 'airtel' | 'zamtel'>('airtel');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'failed' | 'success'>('idle');
  const [failureReason, setFailureReason] = useState('');

  const supabase = createClient();

  const handlePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to make a payment');
      return;
    }

    // If transaction ID is provided, verify it directly
    if (transactionId.trim()) {
      setIsProcessing(true);
      setError('');
      try {
        const verifyResult = await lencoPayService.verifyPayment(transactionId);
        
        if (verifyResult.success && verifyResult.data?.status === 'completed') {
          await grantAccess(user.id, 'mobile_money', transactionId);
          return;
        } else {
          setError('Invalid or incomplete transaction ID');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to verify transaction');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Validate phone number for mobile money
    if (!lencoPayService.isValidZambianPhone(phoneNumber)) {
      setError('Please enter a valid Zambian phone number (e.g., 0977123456)');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const email = profile?.email || user.email || '';

      // Initiate payment
      const response = await fetch('https://api.vibeslinx.com/api/payments/referral-access/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: email,
          phone: phoneNumber,
          operator: operator,
        }),
      });

      const paymentData = await response.json();

      if (!paymentData.success || !paymentData.data?.reference) {
        throw new Error(paymentData.error?.message || 'Failed to initiate payment');
      }

      setPaymentReference(paymentData.data.reference);
      setPaymentStatus('waiting');
      setError('Please check your phone and approve the payment prompt...');

      // Poll for payment status
      const statusResult = await lencoPayService.pollPaymentStatus(
        paymentData.data.reference,
        30,
        10000
      );

      if (statusResult.success && statusResult.data?.status === 'completed') {
        setPaymentStatus('success');
        await grantAccess(user.id, 'mobile_money', paymentData.data.reference);
      } else {
        setPaymentStatus('failed');
        const reason = extractFailureReason(statusResult);
        setFailureReason(reason);
        
        if (statusResult.data?.status === 'failed') {
          setError(`Payment failed: ${reason}`);
        } else {
          setError('Payment verification timed out. Please check your payment status.');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentStatus('failed');
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const grantAccess = async (userId: string, method: string, reference: string) => {
    const { error: grantError } = await supabase
      .rpc('grant_provider_referral_access', {
        p_user_id: userId,
        p_payment_method: method,
        p_payment_reference: reference,
      });

    if (grantError) throw grantError;

    setStep(3);
  };

  const extractFailureReason = (statusResponse: any): string => {
    const message = statusResponse.data?.message || statusResponse.error?.message || '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('insufficient') || lowerMessage.includes('balance')) {
      return 'Insufficient balance in your mobile money account';
    }
    if (lowerMessage.includes('declined') || lowerMessage.includes('reject')) {
      return 'Payment was declined by your mobile money provider';
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('expired')) {
      return 'Payment request timed out - you did not approve in time';
    }
    if (lowerMessage.includes('cancel')) {
      return 'Payment was cancelled';
    }
    if (lowerMessage.includes('invalid')) {
      return 'Invalid payment details provided';
    }
    
    return message || 'Payment failed. Please try again.';
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStep(1);
      setPhoneNumber('');
      setOperator('airtel');
      setTransactionId('');
      setError('');
      setPaymentReference('');
      setPaymentStatus('idle');
      setFailureReason('');
      onClose();
    }
  };

  const handleRetry = () => {
    setError('');
    setPaymentStatus('idle');
    setFailureReason('');
    setPaymentReference('');
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    const detectedOperator = lencoPayService.detectOperator(value);
    if (detectedOperator) {
      setOperator(detectedOperator);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 3
              ? 'Payment Successful!'
              : 'Unlock Referral Program'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Payment Overview */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">K30</p>
              <p className="text-sm text-muted-foreground mt-1">
                One-time payment • Lifetime access
              </p>
            </div>

            {/* Benefits */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="font-medium text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                What you get:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Lifetime access to referral program</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Earn K20 for each successful referral</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Track all your referrals and earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Unlimited referral link sharing</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3"
            >
              <Smartphone className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium">Pay with Mobile Money</p>
                <p className="text-xs text-muted-foreground">Airtel, MTN, or Zamtel</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">K30</p>
              <p className="text-sm text-muted-foreground">Mobile Money Payment</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Mobile Money Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0977 123 456"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="mt-1"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Airtel, MTN, or Zamtel number
                </p>
              </div>

              <div>
                <Label>Mobile Money Operator</Label>
                <RadioGroup
                  value={operator}
                  onValueChange={(value) => setOperator(value as 'mtn' | 'airtel' | 'zamtel')}
                  className="mt-2 space-y-2"
                  disabled={isProcessing}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="airtel" id="airtel" />
                    <Label htmlFor="airtel" className="font-normal cursor-pointer">
                      Airtel Money
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtn" id="mtn" />
                    <Label htmlFor="mtn" className="font-normal cursor-pointer">
                      MTN Mobile Money
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zamtel" id="zamtel" />
                    <Label htmlFor="zamtel" className="font-normal cursor-pointer">
                      Zamtel Kwacha
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Transaction ID (Optional) */}
              <div>
                <Label htmlFor="transaction">Already paid? Enter Transaction ID</Label>
                <Input
                  id="transaction"
                  type="text"
                  placeholder="Transaction reference"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>

              {/* Payment Status Indicator */}
              {paymentStatus === 'waiting' && (
                <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    <strong>Waiting for approval...</strong>
                    <br />
                    Please check your phone and approve the payment prompt.
                    {paymentReference && (
                      <span className="block text-xs mt-1 opacity-70">
                        Reference: {paymentReference}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {paymentStatus === 'failed' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Payment Failed</strong>
                    <br />
                    {failureReason || error}
                    {paymentReference && (
                      <span className="block text-xs mt-1 opacity-70">
                        Reference: {paymentReference}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {error && paymentStatus === 'idle' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 You'll receive a prompt on your phone to approve the payment
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {paymentStatus !== 'failed' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing || (!phoneNumber && !transactionId)}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {paymentStatus === 'waiting' ? 'Waiting for approval...' : 'Processing...'}
                      </>
                    ) : (
                      'Pay K30'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success Message */}
        {step === 3 && (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                Welcome to the Referral Program!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                You now have lifetime access. Start sharing your referral link and earn K20 for each successful referral!
              </p>
            </div>

            <Button onClick={() => { handleClose(); onSuccess(); }} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
