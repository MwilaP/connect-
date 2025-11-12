import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { CreditCard, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  purpose: 'subscription' | 'contact_unlock';
  onSuccess: (paymentMethod: 'mobile_money' | 'card') => Promise<boolean>;
  providerName?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  purpose,
  onSuccess,
  providerName,
}: PaymentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePaymentMethodSelect = (method: 'mobile_money' | 'card') => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = await onSuccess(paymentMethod);

    setIsProcessing(false);

    if (success) {
      setStep(3);
    } else {
      alert('Payment failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStep(1);
    setPhoneNumber('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    onClose();
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
              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone">Mobile Money Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0977 123 456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive a prompt to confirm payment
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
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay K${amount}`
                )}
              </Button>
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
