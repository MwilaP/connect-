import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import type { ReferralCode, ReferralStats, Referral, ReferralReward } from '../../lib/types/referral';

export interface ReferralAccess {
  hasAccess: boolean;
  accessType: 'subscription' | 'payment' | 'none';
  message: string;
}

export function useReferral() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<ReferralAccess | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Check if user has access to referral program
  const checkAccess = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('check_referral_access', { p_user_id: userId });

      if (error) throw error;

      if (data && data.length > 0) {
        setAccess({
          hasAccess: data[0].has_access,
          accessType: data[0].access_type,
          message: data[0].message,
        });
      }
    } catch (err) {
      console.error('Error checking access:', err);
      setError(err instanceof Error ? err.message : 'Failed to check access');
    }
  }, [supabase]);

  // Get user's referral code
  const fetchReferralCode = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setReferralCode(data);
      } else {
        // Create referral code if it doesn't exist
        const { data: newCode, error: createError } = await supabase
          .rpc('create_referral_code_for_user', { p_user_id: userId });

        if (createError) throw createError;

        // Fetch the newly created code
        const { data: createdCode } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (createdCode) {
          setReferralCode(createdCode);
        }
      }
    } catch (err) {
      console.error('Error fetching referral code:', err);
      setError('Failed to load referral code');
    }
  }, [supabase]);

  // Get referral stats
  const fetchStats = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_referral_stats', { p_user_id: userId });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      } else {
        setStats({
          total_referrals: 0,
          successful_referrals: 0,
          pending_referrals: 0,
          total_earnings: 0,
          paid_earnings: 0,
          pending_earnings: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load referral statistics');
    }
  }, [supabase]);

  // Get user's referrals
  const fetchReferrals = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('referred_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    }
  }, [supabase]);

  // Get user's rewards
  const fetchRewards = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRewards(data || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards');
    }
  }, [supabase]);

  // Track a referral (called during signup)
  const trackReferral = async (referralCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('track_referral', {
          p_referred_user_id: user.id,
          p_referral_code: referralCode,
        });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error tracking referral:', err);
      throw err;
    }
  };

  // Validate referral code
  const validateReferralCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (error || !data) return false;
      return true;
    } catch (err) {
      console.error('Error validating referral code:', err);
      return false;
    }
  };

  // Generate referral link (memoized)
  const getReferralLink = useMemo((): string => {
    if (!referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/signup?ref=${referralCode.referral_code}`;
  }, [referralCode]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getReferralLink);
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      return false;
    }
  }, [getReferralLink]);

  // Share referral link (using Web Share API if available)
  const shareReferralLink = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join our platform!',
          text: 'Sign up using my referral link and get started!',
          url: getReferralLink,
        });
        return true;
      } else {
        // Fallback to copying
        return await copyReferralLink();
      }
    } catch (err) {
      console.error('Error sharing:', err);
      return false;
    }
  }, [getReferralLink, copyReferralLink]);

  // Refresh all data (optimized with parallel fetching)
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Run all fetches in parallel for faster loading
      await Promise.all([
        checkAccess(user.id),
        fetchReferralCode(user.id),
        fetchStats(user.id),
        fetchReferrals(user.id),
        fetchRewards(user.id),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [supabase, checkAccess, fetchReferralCode, fetchStats, fetchReferrals, fetchRewards]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    referralCode,
    stats,
    referrals,
    rewards,
    loading,
    error,
    access,
    trackReferral,
    validateReferralCode,
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
    refresh,
  };
}
