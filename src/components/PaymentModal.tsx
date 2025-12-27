import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { CreditCard, Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';
import { lencoPayService } from '../services/lencopay.service';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  purpose: 'subscription' | 'contact_unlock';
  onSuccess: (paymentMethod: 'mobile_money' | 'card') => Promise<boolean>;
  providerName?: string;
  providerId?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  purpose,
  onSuccess,
  providerName,
  providerId,
}: PaymentModalProps) {
  const { user } = useSupabase();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState<'mtn' | 'airtel' | 'zamtel'>('airtel');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'failed' | 'success'>('idle');
  const [failureReason, setFailureReason] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePaymentMethodSelect = (method: 'mobile_money' | 'card') => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handlePayment = async () => {
    if (!user) {
      setError('You must be logged in to make a payment');
      return;
    }

    // Validate phone number for mobile money
    if (paymentMethod === 'mobile_money') {
      if (!lencoPayService.isValidZambianPhone(phoneNumber)) {
        setError('Please enter a valid Zambian phone number (e.g., 0977123456)');
        return;
      }
    }

    setIsProcessing(true);
    setError('');

    try {
      let response;

      if (paymentMethod === 'mobile_money') {
        // Initiate payment with Lencopay API
        if (purpose === 'subscription') {
          response = await lencoPayService.initiateSubscriptionPayment({
            userId: user.id,
            email: user.email || '',
            phone: phoneNumber,
            operator,
          });
        } else {
          if (!providerId) {
            setError('Provider ID is required for contact unlock');
            setIsProcessing(false);
            return;
          }
          response = await lencoPayService.initiateContactUnlockPayment({
            userId: user.id,
            email: user.email || '',
            phone: phoneNumber,
            operator,
            providerId,
          });
        }

        if (!response.success || !response.data) {
          setError(response.error?.message || 'Failed to initiate payment');
          setIsProcessing(false);
          return;
        }

        setPaymentReference(response.data.reference);

        // Show waiting status
        setPaymentStatus('waiting');
        setError('Please check your phone and approve the payment prompt...');

        // Poll for payment status
        const statusResponse = await lencoPayService.pollPaymentStatus(
          response.data.reference,
          30, // 30 attempts
          10000 // 10 seconds interval
        );

        if (statusResponse.success && statusResponse.data?.status === 'completed') {
          // Payment successful
          setPaymentStatus('success');
          const success = await onSuccess(paymentMethod);
          if (success) {
            setStep(3);
          } else {
            setPaymentStatus('failed');
            setError('Payment completed but failed to update subscription. Please contact support.');
          }
        } else {
          // Payment failed or timed out
          setPaymentStatus('failed');
          
          // Extract detailed failure reason
          const reason = extractFailureReason(statusResponse);
          setFailureReason(reason);
          
          if (statusResponse.data?.status === 'failed') {
            setError(`Payment failed: ${reason}`);
          } else {
            setError('Payment verification timed out. Please check your payment status.');
          }
        }
      } else {
        // Card payment (simulated for now)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const success = await onSuccess(paymentMethod);
        if (success) {
          setStep(3);
        } else {
          setError('Payment failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
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
      setPaymentReference('');
      setError('');
      setPaymentStatus('idle');
      setFailureReason('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      onClose();
    }
  };

  const handleRetry = () => {
    setError('');
    setPaymentStatus('idle');
    setFailureReason('');
    setPaymentReference('');
  };

  // Auto-detect operator when phone number changes
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
              : purpose === 'subscription'
              ? 'Subscribe to Premium'
              : 'Unlock Contact'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Payment Method Selection */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">K{amount}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {purpose === 'subscription'
                  ? 'Per month - Unlimited access'
                  : `One-time payment${providerName ? ` for ${providerName}` : ''}`}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('mobile_money')}
                className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3"
              >
                <Smartphone className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-xs text-muted-foreground">Pay with Airtel or MTN</p>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('card')}
                className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3"
              >
                <CreditCard className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard accepted</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">K{amount}</p>
              <p className="text-sm text-muted-foreground">
                {paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Card Payment'}
              </p>
            </div>

            {paymentMethod === 'mobile_money' ? (
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
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="mt-1"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="mt-1"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="mt-1"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    disabled={isProcessing || (paymentMethod === 'mobile_money' && !phoneNumber)}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {paymentStatus === 'waiting' ? 'Waiting for approval...' : 'Processing...'}
                      </>
                    ) : (
                      `Pay K${amount}`
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
                {purpose === 'subscription'
                  ? "You're now subscribed!"
                  : 'Contact unlocked successfully!'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {purpose === 'subscription'
                  ? 'Enjoy unlimited access to all provider profiles and photos'
                  : "You can now view this provider's contact information"}
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
