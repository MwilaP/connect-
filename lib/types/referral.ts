export interface ReferralCode {
  id: string;
  user_id: string;
  referral_code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'subscribed' | 'rewarded';
  referred_at: string;
  subscribed_at?: string;
  rewarded_at?: string;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referral_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
}

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
}

export interface ReferralWithDetails extends Referral {
  referred_user_email?: string;
  referred_user_name?: string;
}

export interface ReferralRewardWithDetails extends ReferralReward {
  referral?: Referral;
}
