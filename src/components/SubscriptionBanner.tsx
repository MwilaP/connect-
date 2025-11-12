import { Button } from '../../components/ui/button';
import { Crown, Eye } from 'lucide-react';

interface SubscriptionBannerProps {
  viewsRemaining: number;
  viewsLimit: number;
  onUpgrade: () => void;
}

export function SubscriptionBanner({
  viewsRemaining,
  viewsLimit,
  onUpgrade,
}: SubscriptionBannerProps) {
  const percentage = (viewsRemaining / viewsLimit) * 100;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">
              {viewsRemaining} of {viewsLimit} free profile views left today
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2 mb-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Upgrade to view unlimited profiles and unlock all photos
          </p>
        </div>

        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shrink-0"
        >
          <Crown className="h-4 w-4 mr-1" />
          Upgrade
        </Button>
      </div>
    </div>
  );
}
