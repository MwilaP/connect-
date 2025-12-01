import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  DollarSign,
  Calendar,
  Phone,
  CreditCard,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface WithdrawalRequest {
  id: string;
  points: number;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  transaction_reference?: string;
  rejection_reason?: string;
}

export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalWithdrawn: 0,
  });

  const supabase = useMemo(() => createClient(), []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setWithdrawals(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const completed = data?.filter(w => w.status === 'completed').length || 0;
      const pending = data?.filter(w => w.status === 'pending' || w.status === 'processing').length || 0;
      const totalWithdrawn = data
        ?.filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0) || 0;

      setStats({ total, completed, pending, totalWithdrawn });
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch withdrawal history');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const getPaymentMethodLabel = useCallback((method: string) => {
    switch (method) {
      case 'airtel_money':
        return 'Airtel Money';
      case 'mtn_money':
        return 'MTN Money';
      case 'zamtel_money':
        return 'Zamtel Money';
      default:
        return method;
    }
  }, []);

  const formatPhoneNumber = useCallback((phone: string) => {
    // Format phone number for display (e.g., 0977123456 -> 097 712 3456)
    if (phone.length === 10) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading withdrawal history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                <p className="text-2xl font-bold text-primary">K{stats.totalWithdrawn.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal List */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            Track all your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Withdrawals Yet</h3>
              <p className="text-muted-foreground">
                Your withdrawal requests will appear here once you make one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left Section - Amount & Status */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              K{withdrawal.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.points.toLocaleString()} points
                            </p>
                          </div>
                          {getStatusBadge(withdrawal.status)}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>{getPaymentMethodLabel(withdrawal.payment_method)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{formatPhoneNumber(withdrawal.phone_number)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Requested: {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {withdrawal.completed_at && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                Completed: {format(new Date(withdrawal.completed_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Transaction Reference */}
                        {withdrawal.transaction_reference && (
                          <div className="mt-3 p-2 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Transaction Reference</p>
                            <p className="text-sm font-mono">{withdrawal.transaction_reference}</p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              <strong>Rejection Reason:</strong> {withdrawal.rejection_reason}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Processing Info */}
                        {withdrawal.status === 'pending' && (
                          <Alert className="mt-3">
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Your withdrawal is pending. It will be processed within 24-48 hours.
                            </AlertDescription>
                          </Alert>
                        )}

                        {withdrawal.status === 'processing' && (
                          <Alert className="mt-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription className="text-xs">
                              Your withdrawal is being processed. Money will be sent shortly.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
