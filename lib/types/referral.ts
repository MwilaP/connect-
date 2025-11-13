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
  points: number; // Points earned (20000 points = K20)
  amount: number; // Cash equivalent in Kwacha
  status: 'pending' | 'approved' | 'withdrawn' | 'cancelled';
  created_at: string;
  approved_at?: string;
  withdrawn_at?: string;
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

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  points: number;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  transaction_reference?: string;
  admin_notes?: string;
  rejection_reason?: string;
}
