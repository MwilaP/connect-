import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Lock, Clock } from 'lucide-react';

interface AccessRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  viewsRemaining: number;
  viewsLimit: number;
}

export function AccessRestrictionModal({
  isOpen,
  onClose,
  onSubscribe,
  viewsRemaining,
  viewsLimit,
}: AccessRestrictionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex justify-center mb-2">
              <Lock className="h-12 w-12 text-amber-500" />
            </div>
            Daily Limit Reached
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              You've viewed <span className="font-semibold">{viewsLimit}</span> profiles today.
            </p>
            <p className="text-muted-foreground mt-1">
              Subscribe for unlimited access to all provider profiles.
            </p>
          </div>

          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Premium Benefits:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Unlimited profile views</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>View all provider photos (unblurred)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Priority customer support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Save favorite providers</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={onSubscribe} className="w-full" size="lg">
              Subscribe for K100/month
            </Button>

            <Button onClick={onClose} variant="outline" className="w-full">
              Maybe Later
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Your limit will reset in 24 hours</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
