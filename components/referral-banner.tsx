import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, Gift, ArrowRight } from 'lucide-react';

interface ReferralBannerProps {
  dismissible?: boolean;
  compact?: boolean;
}

export function ReferralBanner({ dismissible = true, compact = false }: ReferralBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Gift className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <p className="text-sm font-medium">
                Earn <span className="text-purple-600 font-bold">20,000</span> for every friend who subscribes!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/referrals">
                  Learn More
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              {dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-bold">Refer Friends & Earn Rewards!</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Share your unique referral link with friends. When they sign up and subscribe,
              you'll automatically earn <span className="font-bold text-purple-600">20,000</span>!
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/referrals">
                  Get Your Referral Link
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/referrals">View My Earnings</Link>
              </Button>
            </div>
          </div>
          {dismissible && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
