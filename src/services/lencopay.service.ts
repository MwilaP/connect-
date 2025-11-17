import { createClient } from '../../lib/supabase/client';

const PAYMENT_API_URL = 'http://localhost:3001/api/payments';

export interface InitiatePaymentRequest {
  userId: string;
  email: string;
  phone: string;
  operator: 'mtn' | 'airtel' | 'zamtel';
  providerId?: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    reference: string;
    paymentId: string;
    status: string;
  };
  error?: {
    message: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data?: {
    id: string;
    user_id: string;
    amount: number;
    payment_type: 'subscription' | 'contact_unlock';
    payment_method: 'mobile_money' | 'card';
    status: 'pending' | 'completed' | 'failed';
    transaction_reference: string;
    created_at: string;
    completed_at?: string;
  };
  error?: {
    message: string;
  };
}

class LencoPayService {
  /**
   * Initiate a subscription payment
   */
  async initiateSubscriptionPayment(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${PAYMENT_API_URL}/subscription/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          email: request.email,
          phone: request.phone,
          operator: request.operator,
          plan: 'monthly',
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to initiate subscription payment:', error);
      return {
        success: false,
        error: {
          message: 'Failed to initiate payment. Please try again.',
        },
      };
    }
  }

  /**
   * Initiate a contact unlock payment
   */
  async initiateContactUnlockPayment(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    try {
      if (!request.providerId) {
        throw new Error('Provider ID is required for contact unlock');
      }

      const response = await fetch(`${PAYMENT_API_URL}/contact-unlock/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: request.userId,
          providerId: request.providerId,
          email: request.email,
          phone: request.phone,
          operator: request.operator,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to initiate contact unlock payment:', error);
      return {
        success: false,
        error: {
          message: 'Failed to initiate payment. Please try again.',
        },
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${PAYMENT_API_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      return {
        success: false,
        error: {
          message: 'Failed to verify payment. Please try again.',
        },
      };
    }
  }

  /**
   * Poll payment status until completed or failed
   */
  async pollPaymentStatus(
    reference: string,
    maxAttempts: number = 30,
    intervalMs: number = 10000
  ): Promise<PaymentStatusResponse> {
    let attempts = 0;

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(`${PAYMENT_API_URL}/${reference}`);
          const data = await response.json();

          if (data.success && data.data) {
            if (data.data.status === 'completed') {
              clearInterval(interval);
              resolve(data);
            } else if (data.data.status === 'failed' || attempts >= maxAttempts) {
              clearInterval(interval);
              resolve(data);
            }
          }
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve({
            success: false,
            error: {
              message: 'Payment verification timed out',
            },
          });
        }
      }, intervalMs);
    });
  }

  /**
   * Detect mobile money operator from phone number
   */
  detectOperator(phone: string): 'mtn' | 'airtel' | 'zamtel' | null {
    // Remove spaces and any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // MTN prefixes: 096, 076
    if (cleanPhone.startsWith('096') || cleanPhone.startsWith('076')) {
      return 'mtn';
    }

    // Airtel prefixes: 097, 077
    if (cleanPhone.startsWith('097') || cleanPhone.startsWith('077')) {
      return 'airtel';
    }

    // Zamtel prefixes: 095, 075
    if (cleanPhone.startsWith('095') || cleanPhone.startsWith('075')) {
      return 'zamtel';
    }

    return null;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
    }
    return phone;
  }

  /**
   * Validate Zambian phone number
   */
  isValidZambianPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return /^(09|07)\d{8}$/.test(cleanPhone);
  }
}

export const lencoPayService = new LencoPayService();
