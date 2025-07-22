import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Store, Edit, Trash2, ChevronRight, Map, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type Franchise = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  active: boolean;
  opening_date: string;
  notes: string | null;
  inventory_count: number;
  owner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  staff_count: number;
};

export default function FranchisesPage() {
  const { user, isFranchisor, isAdmin } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // New/edit franchise form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFranchise, setCurrentFranchise] = useState<Partial<Franchise> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentFranchise(null);
    setIsEditing(false);
    setFormError(null);
  };

  useEffect(() => {
    fetchFranchises();
  }, [user]);

  const fetchFranchises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('franchises')
        .select(`
          *,
          user_profiles(id, full_name, email, role)
        `)
        .order('name');
        
      if (error) throw error;
      
      // Process the data to count staff and identify owner
      const processedData: Franchise[] = data.map((franchise: any) => {
        let owner = null;
        let staffCount = 0;
        
        if (franchise.user_profiles) {
          const staffMembers = Array.isArray(franchise.user_profiles) 
            ? franchise.user_profiles 
            : [franchise.user_profiles];
            
          staffCount = staffMembers.length;
          
          // Find the owner (assuming role contains 'owner')
          const ownerProfile = staffMembers.find((staff: any) => 
            staff.role === 'franchisee_owner'
          );
          
          if (ownerProfile) {
            owner = {
              id: ownerProfile.id,
              full_name: ownerProfile.full_name,
              email: ownerProfile.email
            };
          }
        }
        
        return {
          ...franchise,
          owner,
          staff_count: staffCount,
          inventory_count: franchise.inventory_count || 0 // This would be populated from a join if available
        };
      });
      
      setFranchises(processedData);
    } catch (err: any) {
      console.error('Error fetching franchises:', err);
      setError(err.message || 'Failed to load franchises');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateFranchise = async () => {
    try {
      setFormError(null);
      
      if (!currentFranchise?.name || !currentFranchise?.address) {
        setFormError('Name and address are required');
        return;
      }
      
      if (isEditing && currentFranchise.id) {
        // Update existing franchise
        const { error } = await supabase
          .from('franchises')
          .update({
            name: currentFranchise.name,
            address: currentFranchise.address,
            city: currentFranchise.city,
            state: currentFranchise.state,
            postal_code: currentFranchise.postal_code,
            country: currentFranchise.country,
            phone: currentFranchise.phone,
            email: currentFranchise.email,
            active: currentFranchise.active !== false, // Default to true
            notes: currentFranchise.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentFranchise.id);
          
        if (error) throw error;
        
      } else {
        // Create new franchise
        const { error } = await supabase
          .from('franchises')
          .insert([
            {
              name: currentFranchise.name,
              address: currentFranchise.address,
              city: currentFranchise.city,
              state: currentFranchise.state,
              postal_code: currentFranchise.postal_code,
              country: currentFranchise.country,
              phone: currentFranchise.phone,
              email: currentFranchise.email,
              active: currentFranchise.active !== false, // Default to true
              opening_date: currentFranchise.opening_date || new Date().toISOString(),
              notes: currentFranchise.notes
            }
          ]);
          
        if (error) throw error;
      }
      
      // Refresh franchises list
      await fetchFranchises();
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
      
    } catch (err: any) {
      console.error('Error saving franchise:', err);
      setFormError(err.message || 'Failed to save franchise');
    }
  };

  const handleDeleteFranchise = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this franchise? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('franchises')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove from local state
      setFranchises(franchises.filter(f => f.id !== id));
      
    } catch (err: any) {
      console.error('Error deleting franchise:', err);
      alert(`Failed to delete franchise: ${err.message}`);
    }
  };

  const editFranchise = (franchise: Franchise) => {
    setCurrentFranchise(franchise);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Filter franchises based on search term
  const filteredFranchises = franchises.filter(franchise => 
    franchise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isFranchisor) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertDescription>
            You don't have permission to access the franchise management page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Franchises</h1>
          <p className="text-muted-foreground">Manage your franchise network</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Franchise
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search franchises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <Tabs 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as 'grid' | 'table')}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="grid" className="flex-1 sm:flex-none">Grid View</TabsTrigger>
            <TabsTrigger value="table" className="flex-1 sm:flex-none">Table View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {filteredFranchises.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No franchises found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term" : "Create your first franchise to get started"}
              </p>
            </div>
          ) : (
            <>
              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFranchises.map(franchise => (
                    <Card key={franchise.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{franchise.name}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {franchise.city}, {franchise.state}
                            </CardDescription>
                          </div>
                          {franchise.active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 hover:bg-gray-50">Inactive</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Inventory</p>
                            <p className="font-medium">{franchise.inventory_count} items</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Staff</p>
                            <p className="font-medium">{franchise.staff_count} members</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground mb-1">Contact</p>
                            <p className="font-medium flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1" />
                              {franchise.phone || "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editFranchise(franchise)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFranchise(franchise.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Link to={`/franchise/${franchise.id}/details`}>
                          <Button variant="ghost" size="sm">
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Inventory</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFranchises.map(franchise => (
                        <TableRow key={franchise.id}>
                          <TableCell>
                            <div className="font-medium">{franchise.name}</div>
                          </TableCell>
                          <TableCell>
                            {franchise.city}, {franchise.state}, {franchise.country}
                          </TableCell>
                          <TableCell>
                            {franchise.active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 hover:bg-gray-50">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{franchise.inventory_count} items</TableCell>
                          <TableCell>{franchise.staff_count} members</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/franchise/${franchise.id}/details`}>View</Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => editFranchise(franchise)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFranchise(franchise.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </>
          )}
        </>
      )}
      
      {/* Franchise Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Franchise' : 'Create New Franchise'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details of your franchise.' : 'Add a new franchise to your network.'}
            </DialogDescription>
          </DialogHeader>
          
          {formError && (
            <Alert className="bg-destructive/15">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Franchise Name</Label>
                <Input 
                  id="name" 
                  value={currentFranchise?.name || ''} 
                  onChange={(e) => setCurrentFranchise({...currentFranchise, name: e.target.value})}
                  placeholder="Enter franchise name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input 
                  id="address" 
                  value={currentFranchise?.address || ''} 
                  onChange={(e) => setCurrentFranchise({...currentFranchise, address: e.target.value})}
                  placeholder="123 Main St"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={currentFranchise?.city || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input 
                    id="state" 
                    value={currentFranchise?.state || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, state: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input 
                    id="postal_code" 
                    value={currentFranchise?.postal_code || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, postal_code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    value={currentFranchise?.country || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, country: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={currentFranchise?.phone || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={currentFranchise?.email || ''} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, email: e.target.value})}
                  />
                </div>
              </div>
              
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="opening_date">Opening Date</Label>
                  <Input 
                    id="opening_date" 
                    type="date"
                    value={currentFranchise?.opening_date?.split('T')[0] || new Date().toISOString().split('T')[0]} 
                    onChange={(e) => setCurrentFranchise({...currentFranchise, opening_date: e.target.value})}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active Status</Label>
                  <Switch 
                    id="active" 
                    checked={currentFranchise?.active !== false} 
                    onCheckedChange={(checked) => setCurrentFranchise({...currentFranchise, active: checked})}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Inactive franchises won't appear in reports and dashboards by default
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  value={currentFranchise?.notes || ''} 
                  onChange={(e) => setCurrentFranchise({...currentFranchise, notes: e.target.value})}
                  placeholder="Additional information about this franchise..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdateFranchise}>
              {isEditing ? 'Update Franchise' : 'Create Franchise'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}