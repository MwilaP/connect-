import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Search, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface Subscription {
  id: string;
  user_id: string;
  active: boolean;
  plan: string;
  amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    let filtered = subscriptions;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(
        (sub) => sub.active && new Date(sub.end_date) > new Date()
      );
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(
        (sub) => !sub.active || new Date(sub.end_date) <= new Date()
      );
    }

    // Filter by search term (search both name and email)
    if (searchTerm) {
      filtered = filtered.filter((sub) =>
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, filterStatus, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      const { data: subsData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details from profile tables (no admin API needed)
      const subsWithUserDetails = await Promise.all(
        (subsData || []).map(async (sub) => {
          // Try provider profile first
          const { data: providerData } = await supabase
            .from('provider_profiles')
            .select('name, user_id')
            .eq('user_id', sub.user_id)
            .single();
          
          if (providerData) {
            return {
              ...sub,
              user_name: providerData.name,
              user_email: 'Provider', // We can't get email without admin API
            };
          }
          
          // Try client profile
          const { data: clientData } = await supabase
            .from('client_profiles')
            .select('name, user_id')
            .eq('user_id', sub.user_id)
            .single();
          
          if (clientData) {
            return {
              ...sub,
              user_name: clientData.name,
              user_email: 'Client',
            };
          }
          
          return {
            ...sub,
            user_name: 'Unknown User',
            user_email: 'N/A',
          };
        })
      );

      setSubscriptions(subsWithUserDetails);
      setFilteredSubscriptions(subsWithUserDetails);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = (subscription: Subscription) => {
    return subscription.active && new Date(subscription.end_date) > new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (isActive(subscription)) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(isActive).length,
    expired: subscriptions.filter((s) => !isActive(s)).length,
    revenue: subscriptions
      .filter(isActive)
      .reduce((sum, s) => sum + Number(s.amount), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions Management</h1>
        <p className="text-gray-600 mt-1">Manage all user subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              K{stats.revenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'expired' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('expired')}
                >
                  Expired
                </Button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{subscription.user_name}</div>
                          <div className="text-xs text-gray-500">{subscription.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subscription.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">K{subscription.amount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(subscription.start_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(subscription.end_date)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
