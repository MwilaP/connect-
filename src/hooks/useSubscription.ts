// This hook is now a wrapper around the SubscriptionContext
// It maintains backward compatibility with existing code
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

export function useSubscription() {
  return useSubscriptionContext();
}
