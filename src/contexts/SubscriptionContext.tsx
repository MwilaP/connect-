import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useSupabase } from './SupabaseContext';
import type { Subscription, SubscriptionStatus } from '../../lib/types/subscription';

const DAILY_FREE_VIEWS_LIMIT = 3;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache for subscription data
let subscriptionCache: {
  data: SubscriptionStatus | null;
  timestamp: number;
  userId: string | null;
} = {
  data: null,
  timestamp: 0,
  userId: null,
};

type SubscriptionContextType = {
  subscriptionStatus: SubscriptionStatus;
  loading: boolean;
  trackProfileView: (providerId: string) => Promise<boolean>;
  checkContactUnlock: (providerId: string) => Promise<boolean>;
  unlockContact: (providerId: string) => Promise<boolean>;
  subscribe: (paymentMethod: 'mobile_money' | 'card') => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useSupabase();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(() => {
    // Initialize with cached data if available and valid
    if (subscriptionCache.data && subscriptionCache.userId === user?.id) {
      const cacheAge = Date.now() - subscriptionCache.timestamp;
      if (cacheAge < CACHE_DURATION) {
        return subscriptionCache.data;
      }
    }
    return {
      hasActiveSubscription: false,
      dailyViewsCount: 0,
      dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
      canViewMore: true,
    };
  });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchSubscriptionStatus = useCallback(async (forceRefresh = false) => {
    if (!user) {
      const guestStatus = {
        hasActiveSubscription: false,
        dailyViewsCount: 0,
        dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore: true,
      };
      setSubscriptionStatus(guestStatus);
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && subscriptionCache.userId === user.id) {
      const cacheAge = Date.now() - subscriptionCache.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('📦 Using cached subscription data');
        setSubscriptionStatus(subscriptionCache.data!);
        setLoading(false);
        setInitialized(true);
        return;
      }
    }

    const supabase = createClient();
    setLoading(true);

    try {
      // Parallel fetch for better performance
      const today = new Date().toISOString().split('T')[0];
      
      const [subscriptionResult, viewsResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('id, active, end_date, plan, amount')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profile_views_tracking')
          .select('provider_id', { count: 'exact', head: false })
          .eq('client_id', user.id)
          .eq('view_date', today)
      ]);

      const subscription = subscriptionResult.data;
      const viewsData = viewsResult.data;

      // Check if subscription is active and not expired
      const hasActiveSubscription = subscription
        ? subscription.active && new Date(subscription.end_date) > new Date()
        : false;

      // Count unique providers viewed today
      const uniqueProviders = new Set(viewsData?.map(v => v.provider_id) || []);
      const viewsCount = uniqueProviders.size;
      const canViewMore = hasActiveSubscription || viewsCount < DAILY_FREE_VIEWS_LIMIT;

      const newStatus: SubscriptionStatus = {
        hasActiveSubscription,
        subscription: subscription || undefined,
        dailyViewsCount: viewsCount,
        dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore,
      };

      // Update cache
      subscriptionCache = {
        data: newStatus,
        timestamp: Date.now(),
        userId: user.id,
      };

      console.log('📊 Subscription Status Updated:', {
        hasActiveSubscription,
        viewsCount,
        limit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore,
        cached: true
      });

      setSubscriptionStatus(newStatus);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Even on error, set initialized to true to prevent infinite loading
      const errorStatus = {
        hasActiveSubscription: false,
        dailyViewsCount: 0,
        dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore: true,
      };
      setSubscriptionStatus(errorStatus);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user]);

  // Fetch subscription status when user changes
  useEffect(() => {
    // Wait for user loading to complete before fetching subscription
    if (!userLoading) {
      fetchSubscriptionStatus(false);
    }
  }, [user, userLoading, fetchSubscriptionStatus]);

  const trackProfileView = useCallback(async (providerId: string) => {
    if (!user) return false;

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Use upsert to avoid race conditions
      const { error: upsertError, data } = await supabase
        .from('profile_views_tracking')
        .upsert(
          {
            client_id: user.id,
            provider_id: providerId,
            view_date: today,
          },
          {
            onConflict: 'client_id,provider_id,view_date',
            ignoreDuplicates: true
          }
        )
        .select();

      if (upsertError) {
        console.error('Error tracking view:', upsertError);
        return false;
      }

      // Only update count if this was a new view
      if (data && data.length > 0) {
        console.log(`✅ Tracked new view for provider ${providerId}`);
        
        setSubscriptionStatus(prev => {
          const newCount = prev.dailyViewsCount + 1;
          const newStatus = {
            ...prev,
            dailyViewsCount: newCount,
            canViewMore: prev.hasActiveSubscription || newCount < DAILY_FREE_VIEWS_LIMIT,
          };
          
          // Update cache
          if (subscriptionCache.userId === user.id) {
            subscriptionCache.data = newStatus;
          }
          
          return newStatus;
        });
      } else {
        console.log(`ℹ️ Provider ${providerId} already viewed today`);
      }

      return true;
    } catch (error) {
      console.error('Error tracking profile view:', error);
      return false;
    }
  }, [user]);

  const checkContactUnlock = useCallback(async (providerId: string): Promise<boolean> => {
    if (!user) return false;

    const supabase = createClient();

    try {
      const { data } = await supabase
        .from('contact_unlocks')
        .select('id')
        .eq('client_id', user.id)
        .eq('provider_id', providerId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      return false;
    }
  }, [user]);

  const unlockContact = useCallback(async (providerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Payment and contact unlock are already created by the payment API
      // when the payment completes (via webhook or polling)
      // We just need to verify the unlock was successful
      console.log('Payment completed, verifying contact unlock...');
      
      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if unlock was successful
      const hasAccess = await checkContactUnlock(providerId);
      
      if (!hasAccess) {
        console.error('Contact unlock not found after payment');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying contact unlock:', error);
      return false;
    }
  }, [user, checkContactUnlock]);

  const subscribe = useCallback(async (paymentMethod: 'mobile_money' | 'card'): Promise<boolean> => {
    if (!user) return false;

    try {
      // Payment and subscription are already created by the payment API
      // when the payment completes (via webhook or polling)
      // We just need to refresh the subscription status
      console.log('Payment completed, refreshing subscription status...');
      
      // Force refresh to get latest data
      await fetchSubscriptionStatus(true);

      return true;
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      return false;
    }
  }, [user, fetchSubscriptionStatus]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Force refresh to get latest data
      await fetchSubscriptionStatus(true);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }, [user, fetchSubscriptionStatus]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        loading,
        trackProfileView,
        checkContactUnlock,
        unlockContact,
        subscribe,
        cancelSubscription,
        refreshStatus: fetchSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
