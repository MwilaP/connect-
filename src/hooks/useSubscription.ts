import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useSupabase } from '../SupabaseContext';
import type { Subscription, SubscriptionStatus } from '../../lib/types/subscription';

const DAILY_FREE_VIEWS_LIMIT = 3;

export function useSubscription() {
  const { user } = useSupabase();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    dailyViewsCount: 0,
    dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
    canViewMore: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;

    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check if subscription is active and not expired
      const hasActiveSubscription = subscription
        ? subscription.active && new Date(subscription.end_date) > new Date()
        : false;

      // Fetch daily views count - count DISTINCT providers viewed today
      const today = new Date().toISOString().split('T')[0];
      const { data: viewsData, error: viewsError } = await supabase
        .from('profile_views_tracking')
        .select('provider_id')
        .eq('client_id', user.id)
        .eq('view_date', today);

      if (viewsError) {
        console.error('Error fetching views:', viewsError);
      }

      // Count unique providers viewed today
      const uniqueProviders = new Set(viewsData?.map(v => v.provider_id) || []);
      const viewsCount = uniqueProviders.size;
      const canViewMore = hasActiveSubscription || viewsCount < DAILY_FREE_VIEWS_LIMIT;

      console.log('📊 Subscription Status Update:', {
        hasActiveSubscription,
        viewsCount,
        limit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore,
        uniqueProviders: Array.from(uniqueProviders)
      });

      setSubscriptionStatus({
        hasActiveSubscription,
        subscription: subscription || undefined,
        dailyViewsCount: viewsCount,
        dailyViewsLimit: DAILY_FREE_VIEWS_LIMIT,
        canViewMore,
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (providerId: string) => {
    if (!user) return false;

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Check if already viewed today
      const { data: existingView, error: checkError } = await supabase
        .from('profile_views_tracking')
        .select('*')
        .eq('client_id', user.id)
        .eq('provider_id', providerId)
        .eq('view_date', today)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing view:', checkError);
      }

      if (!existingView) {
        // Insert new view tracking
        const { error: insertError } = await supabase.from('profile_views_tracking').insert({
          client_id: user.id,
          provider_id: providerId,
          view_date: today,
        });

        if (insertError) {
          console.error('Error inserting view tracking:', insertError);
          return false;
        }

        console.log(`✅ Tracked new view for provider ${providerId} on ${today}`);

        // Refresh subscription status to update the count
        await fetchSubscriptionStatus();
      } else {
        console.log(`ℹ️ Provider ${providerId} already viewed today`);
      }

      return true;
    } catch (error) {
      console.error('Error tracking profile view:', error);
      return false;
    }
  };

  const checkContactUnlock = async (providerId: string): Promise<boolean> => {
    if (!user) return false;

    const supabase = createClient();

    try {
      const { data } = await supabase
        .from('contact_unlocks')
        .select('*')
        .eq('client_id', user.id)
        .eq('provider_id', providerId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  const unlockContact = async (providerId: string): Promise<boolean> => {
    if (!user) return false;

    const supabase = createClient();

    try {
      // Create payment record
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: 30,
          payment_type: 'contact_unlock',
          provider_id: providerId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!payment) return false;

      // Create contact unlock record
      await supabase.from('contact_unlocks').insert({
        client_id: user.id,
        provider_id: providerId,
        amount: 30,
      });

      return true;
    } catch (error) {
      console.error('Error unlocking contact:', error);
      return false;
    }
  };

  const subscribe = async (paymentMethod: 'mobile_money' | 'card'): Promise<boolean> => {
    if (!user) return false;

    const supabase = createClient();

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create payment record
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: 100,
          payment_type: 'subscription',
          payment_method: paymentMethod,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!payment) return false;

      // Create or update subscription
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        active: true,
        plan: 'monthly',
        amount: 100,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Refresh subscription status
      await fetchSubscriptionStatus();

      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
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

      await fetchSubscriptionStatus();
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  };

  return {
    subscriptionStatus,
    loading,
    trackProfileView,
    checkContactUnlock,
    unlockContact,
    subscribe,
    cancelSubscription,
    refreshStatus: fetchSubscriptionStatus,
  };
}
