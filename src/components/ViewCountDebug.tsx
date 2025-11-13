import { useSubscription } from '../hooks/useSubscription';
import { useSupabase } from '../contexts/SupabaseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

/**
 * Debug component to display current view count status
 * Remove this in production or hide behind a feature flag
 */
export function ViewCountDebug() {
  const { user } = useSupabase();
  const { subscriptionStatus, loading } = useSubscription();

  if (!user || loading) return null;

  const { dailyViewsCount, dailyViewsLimit, canViewMore, hasActiveSubscription } = subscriptionStatus;
  const viewsRemaining = dailyViewsLimit - dailyViewsCount;

  return (
    <Card className="border-dashed border-2 border-blue-300 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View Count Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span>Subscription Status:</span>
          <span className="font-medium flex items-center gap-1">
            {hasActiveSubscription ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-gray-400" />
                Free
              </>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Views Today:</span>
          <span className="font-medium">
            {dailyViewsCount} / {dailyViewsLimit}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Views Remaining:</span>
          <span className={`font-medium ${viewsRemaining === 0 ? 'text-red-500' : 'text-green-600'}`}>
            {hasActiveSubscription ? '∞ Unlimited' : viewsRemaining}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Can View More:</span>
          <span className="font-medium">
            {canViewMore ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div className="pt-2 border-t text-[10px] text-muted-foreground">
          Open browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
}
