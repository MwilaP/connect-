import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReferralCode, ReferralStats, Referral, ReferralReward } from '@/lib/types/referral';

export function useReferral() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Get user's referral code
  const fetchReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setReferralCode(data);
      } else {
        // Create referral code if it doesn't exist
        const { data: newCode, error: createError } = await supabase
          .rpc('create_referral_code_for_user', { p_user_id: user.id });

        if (createError) throw createError;

        // Fetch the newly created code
        const { data: createdCode } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (createdCode) {
          setReferralCode(createdCode);
        }
      }
    } catch (err) {
      console.error('Error fetching referral code:', err);
      setError('Failed to load referral code');
    }
  };

  // Get referral stats
  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_referral_stats', { p_user_id: user.id });

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
  };

  // Get user's referrals
  const fetchReferrals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('referred_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    }
  };

  // Get user's rewards
  const fetchRewards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRewards(data || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards');
    }
  };

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

  // Generate referral link
  const getReferralLink = (): string => {
    if (!referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/signup?ref=${referralCode.referral_code}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async (): Promise<boolean> => {
    try {
      const link = getReferralLink();
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      return false;
    }
  };

  // Share referral link (using Web Share API if available)
  const shareReferralLink = async (): Promise<boolean> => {
    try {
      const link = getReferralLink();
      if (navigator.share) {
        await navigator.share({
          title: 'Join our platform!',
          text: 'Sign up using my referral link and get started!',
          url: link,
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
  };

  // Refresh all data
  const refresh = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchReferralCode(),
      fetchStats(),
      fetchReferrals(),
      fetchRewards(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    referralCode,
    stats,
    referrals,
    rewards,
    loading,
    error,
    trackReferral,
    validateReferralCode,
    getReferralLink,
    copyReferralLink,
    shareReferralLink,
    refresh,
  };
}
