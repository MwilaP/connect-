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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Search, MapPin, Eye, Phone, Calendar } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface Provider {
  id: string;
  user_id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  contact_number: string;
  date_of_birth: string;
  created_at: string;
  user_email?: string;
  view_count?: number;
  services_count?: number;
}

interface ProviderService {
  id: string;
  service_name: string;
  price: number;
  description: string;
}

export default function ProvidersManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = providers.filter(
        (provider) =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(providers);
    }
  }, [searchTerm, providers]);

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const { data: providersData, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each provider
      const providersWithDetails = await Promise.all(
        (providersData || []).map(async (provider) => {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(provider.user_id);
          
          // Get view count
          const { count: viewCount } = await supabase
            .from('profile_views')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', provider.id);

          // Get services count
          const { count: servicesCount } = await supabase
            .from('provider_services')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', provider.id);

          return {
            ...provider,
            user_email: userData?.user?.email || 'Unknown',
            view_count: viewCount || 0,
            services_count: servicesCount || 0,
          };
        })
      );

      setProviders(providersWithDetails);
      setFilteredProviders(providersWithDetails);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch providers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderServices = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId);

      if (error) throw error;

      setProviderServices(data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch provider services',
        variant: 'destructive',
      });
    }
  };

  const viewProviderDetails = async (provider: Provider) => {
    setSelectedProvider(provider);
    await fetchProviderServices(provider.id);
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Providers Management</h1>
        <p className="text-gray-600 mt-1">Manage all service providers on the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {providers.reduce((sum, p) => sum + (p.view_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {providers.reduce((sum, p) => sum + (p.services_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Providers ({filteredProviders.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No providers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {provider.user_email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {provider.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {provider.date_of_birth
                            ? calculateAge(provider.date_of_birth)
                            : provider.age || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {provider.services_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{provider.view_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(provider.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewProviderDetails(provider)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Provider Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
            <DialogDescription>
              Detailed information about the provider
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProvider.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProvider.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Age</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedProvider.date_of_birth
                        ? calculateAge(selectedProvider.date_of_birth)
                        : selectedProvider.age || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProvider.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedProvider.contact_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profile Views</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProvider.view_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedProvider.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bio</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedProvider.bio}
                  </p>
                </div>
              )}

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Services ({providerServices.length})</h3>
                {providerServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No services listed</p>
                ) : (
                  <div className="space-y-3">
                    {providerServices.map((service) => (
                      <div key={service.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{service.service_name}</h4>
                          <Badge className="bg-green-100 text-green-800">
                            K{service.price}
                          </Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
