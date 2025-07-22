import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useInventorySupabase, TransactionItem } from '@/hooks/use-inventory-supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, subDays, parseISO, formatDistance } from 'date-fns';
import { CalendarIcon, Download, Search, Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportType = 'inventory' | 'transactions' | 'lowStock' | 'expiring';
type DateRangeType = 'last7days' | 'last30days' | 'last90days' | 'custom';

export default function ReportsPage() {
  const { user, profile, isFranchisor } = useAuth();
  const { items, isLoading: inventoryLoading, fetchInventory } = useInventorySupabase();
  
  const [activeTab, setActiveTab] = useState<ReportType>('inventory');
  const [franchises, setFranchises] = useState<{id: string; name: string}[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('last30days');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    if (user) {
      fetchFranchises();
      updateDateRange(dateRange);
    }
  }, [user]);
  
  useEffect(() => {
    if (user && startDate && endDate) {
      if (activeTab === 'inventory' || activeTab === 'lowStock' || activeTab === 'expiring') {
        fetchInventory(selectedFranchise !== 'all' ? selectedFranchise : undefined);
      } else if (activeTab === 'transactions') {
        fetchTransactionsData();
      }
    }
  }, [activeTab, selectedFranchise, startDate, endDate, user]);

  const fetchFranchises = async () => {
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFranchises(data || []);
    } catch (error) {
      console.error('Error fetching franchises:', error);
    }
  };

  const updateDateRange = (range: DateRangeType) => {
    setDateRange(range);
    
    const today = new Date();
    
    switch (range) {
      case 'last7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'last90days':
        setStartDate(subDays(today, 90));
        setEndDate(today);
        break;
      case 'custom':
        // Keep current dates and open the date picker
        setDatePickerOpen(true);
        break;
    }
  };

  const fetchTransactionsData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      // Prepare filters based on date range and selected franchise
      let filters: Record<string, any> = {};
      
      if (selectedFranchise !== 'all') {
        filters.source_franchise_id = selectedFranchise;
      }
      
      // Fetch transactions using the supabase utility
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items(id, name, sku, barcode),
          source_franchise:source_franchise_id(id, name),
          destination_franchise:destination_franchise_id(id, name),
          user_profiles(id, full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (selectedFranchise !== 'all') {
        // If franchise is selected, get transactions where it's either source or destination
        query = query.or(`source_franchise_id.eq.${selectedFranchise},destination_franchise_id.eq.${selectedFranchise}`);
      } else if (profile?.franchise_id && !isFranchisor) {
        // If user is a franchisee, only show their franchise's transactions
        query = query.or(`source_franchise_id.eq.${profile.franchise_id},destination_franchise_id.eq.${profile.franchise_id}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setTransactions(data || []);
      
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const downloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let reportData: string[][] = [];
    let headers: string[] = [];
    
    // Prepare CSV data based on active tab
    if (activeTab === 'inventory') {
      headers = ["Name", "SKU", "Barcode", "Category", "Quantity", "Cost Price", "Retail Price", "Status", "Location", "Franchise"];
      
      reportData = filteredInventoryItems.map(item => [
        item.name,
        item.sku,
        item.barcode,
        item.category?.name || 'N/A',
        item.quantity.toString(),
        item.cost_price.toString(),
        item.retail_price.toString(),
        item.status,
        item.location || 'N/A',
        // Get franchise name from franchises array
        franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'
      ]);
    }
    else if (activeTab === 'transactions') {
      headers = ["Date", "Type", "Item", "Quantity", "Source", "Destination", "Created By", "Value"];
      
      reportData = filteredTransactions.map(transaction => [
        format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss'),
        formatTransactionType(transaction.transaction_type),
        transaction.inventory_items?.name || 'Unknown',
        transaction.quantity.toString(),
        transaction.source_franchise?.name || 'N/A',
        transaction.destination_franchise?.name || 'N/A',
        transaction.user_profiles?.full_name || 'Unknown',
        (transaction.quantity * transaction.retail_price).toFixed(2)
      ]);
    }
    else if (activeTab === 'lowStock') {
      headers = ["Name", "SKU", "Barcode", "Category", "Current Quantity", "Min Stock Level", "Status", "Franchise"];
      
      reportData = filteredLowStockItems.map(item => [
        item.name,
        item.sku,
        item.barcode,
        item.category?.name || 'N/A',
        item.quantity.toString(),
        (item.min_stock_level || 'N/A').toString(),
        item.status,
        franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'
      ]);
    }
    else if (activeTab === 'expiring') {
      headers = ["Name", "SKU", "Barcode", "Category", "Quantity", "Expiry Date", "Days Until Expiry", "Franchise"];
      
      reportData = filteredExpiringItems.map(item => [
        item.name,
        item.sku,
        item.barcode,
        item.category?.name || 'N/A',
        item.quantity.toString(),
        item.expiry_date ? format(parseISO(item.expiry_date), 'yyyy-MM-dd') : 'N/A',
        item.expiry_date ? getDaysUntilExpiry(item.expiry_date).toString() : 'N/A',
        franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'
      ]);
    }
    
    // Add title and date range
    csvContent += `${activeTab.toUpperCase()} REPORT\n`;
    csvContent += `Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n\n`;
    
    // Add headers
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    reportData.forEach(row => {
      // Escape any commas within fields by wrapping in quotes
      const escapedRow = row.map(field => {
        // If field contains comma or quotes, wrap in quotes and escape any quotes
        if (field.includes(',') || field.includes('"')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      csvContent += escapedRow.join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'sale': return 'Sale';
      case 'receive': return 'Received';
      case 'transfer': return 'Transfer';
      case 'adjustment_increase': return 'Adjustment (+)';
      case 'adjustment_decrease': return 'Adjustment (-)';
      default: return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const diffInMs = expiry.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'out_of_stock': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'receive': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'transfer': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'adjustment_increase': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
      case 'adjustment_decrease': return 'bg-rose-100 text-rose-800 hover:bg-rose-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Filtered and sorted data
  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties like 'category.name'
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aValue = parts.reduce((obj, key) => obj && obj[key], a);
        bValue = parts.reduce((obj, key) => obj && obj[key], b);
      }
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      // Number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Filter and sort inventory items
  const filteredInventoryItems = sortData(
    items.filter(item => {
      // Apply franchise filter if selected
      if (selectedFranchise !== 'all' && item.franchise_id !== selectedFranchise) {
        return false;
      }
      
      // Apply search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(search) || 
               item.sku.toLowerCase().includes(search) || 
               item.barcode.toLowerCase().includes(search) ||
               (item.category?.name && item.category.name.toLowerCase().includes(search));
      }
      
      return true;
    })
  );

  // Filter and sort transactions
  const filteredTransactions = sortData(
    transactions.filter(transaction => {
      // Apply search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (transaction.inventory_items?.name && transaction.inventory_items.name.toLowerCase().includes(search)) || 
               (transaction.inventory_items?.sku && transaction.inventory_items.sku.toLowerCase().includes(search)) ||
               (transaction.source_franchise?.name && transaction.source_franchise.name.toLowerCase().includes(search)) ||
               (transaction.destination_franchise?.name && transaction.destination_franchise.name.toLowerCase().includes(search)) ||
               transaction.transaction_type.toLowerCase().includes(search);
      }
      
      return true;
    })
  );

  // Filter low stock items
  const filteredLowStockItems = sortData(
    items.filter(item => {
      // Apply franchise filter if selected
      if (selectedFranchise !== 'all' && item.franchise_id !== selectedFranchise) {
        return false;
      }
      
      // Low stock means either status is low_stock or quantity is below min_stock_level
      const isLowStock = item.status === 'low_stock' || 
                        (item.min_stock_level !== null && item.quantity <= item.min_stock_level);
      
      // Apply search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return isLowStock && (
          item.name.toLowerCase().includes(search) || 
          item.sku.toLowerCase().includes(search) || 
          item.barcode.toLowerCase().includes(search) ||
          (item.category?.name && item.category.name.toLowerCase().includes(search))
        );
      }
      
      return isLowStock;
    })
  );

  // Filter expiring items
  const filteredExpiringItems = sortData(
    items.filter(item => {
      // Apply franchise filter if selected
      if (selectedFranchise !== 'all' && item.franchise_id !== selectedFranchise) {
        return false;
      }
      
      // Check if item has expiry date and it's within 30 days from now
      const hasExpiryDate = item.expiry_date !== null;
      const isExpiringSoon = hasExpiryDate && getDaysUntilExpiry(item.expiry_date!) <= 30;
      
      // Apply search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return isExpiringSoon && (
          item.name.toLowerCase().includes(search) || 
          item.sku.toLowerCase().includes(search) || 
          item.barcode.toLowerCase().includes(search) ||
          (item.category?.name && item.category.name.toLowerCase().includes(search))
        );
      }
      
      return isExpiringSoon;
    })
  );

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to view reports</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-muted-foreground">Analyze inventory and transaction data</p>
        </div>
        <Button variant="outline" onClick={downloadReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} className="mb-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="transactions">Transactions Report</TabsTrigger>
          <TabsTrigger value="lowStock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Items</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-auto flex-grow">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'inventory' || activeTab === 'lowStock' || activeTab === 'expiring' ? 'items' : 'transactions'}...`}
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={dateRange} onValueChange={(value: DateRangeType) => updateDateRange(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRange === 'custom' && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    <>
                      {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={startDate}
                  selected={{
                    from: startDate,
                    to: endDate,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setStartDate(range.from);
                    }
                    if (range?.to) {
                      setEndDate(range.to);
                    }
                    if (range?.from && range?.to) {
                      setDatePickerOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Select 
            value={selectedFranchise} 
            onValueChange={setSelectedFranchise}
            disabled={!isFranchisor}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select franchise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Franchises</SelectItem>
              {franchises.map((franchise) => (
                <SelectItem key={franchise.id} value={franchise.id}>
                  {franchise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading || inventoryLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <CardTitle>{activeTab === 'inventory' ? 'Inventory Report' : 
                           activeTab === 'transactions' ? 'Transactions Report' :
                           activeTab === 'lowStock' ? 'Low Stock Report' :
                           'Expiring Items Report'}</CardTitle>
                <CardDescription>
                  {activeTab === 'inventory' && `Showing ${filteredInventoryItems.length} items`}
                  {activeTab === 'transactions' && `Showing ${filteredTransactions.length} transactions`}
                  {activeTab === 'lowStock' && `Showing ${filteredLowStockItems.length} low stock items`}
                  {activeTab === 'expiring' && `Showing ${filteredExpiringItems.length} items expiring soon`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'inventory' && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('name')}>
                          Name
                          {sortField === 'name' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('sku')}>
                          SKU/Barcode
                          {sortField === 'sku' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('category.name')}>
                          Category
                          {sortField === 'category.name' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('quantity')}>
                          Quantity
                          {sortField === 'quantity' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('retail_price')}>
                          Price
                          {sortField === 'retail_price' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      {isFranchisor && (
                        <TableHead>Franchise</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isFranchisor ? 7 : 6} className="h-24 text-center">
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <div>SKU: {item.sku}</div>
                            <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>
                          </TableCell>
                          <TableCell>{item.category?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.retail_price)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(getStatusColor(item.status))}>
                              {formatStatus(item.status)}
                            </Badge>
                          </TableCell>
                          {isFranchisor && (
                            <TableCell>
                              {franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('created_at')}>
                          Date
                          {sortField === 'created_at' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('inventory_items.name')}>
                          Item
                          {sortField === 'inventory_items.name' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('quantity')}>
                          Quantity
                          {sortField === 'quantity' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      {isFranchisor && (
                        <>
                          <TableHead>Source</TableHead>
                          <TableHead>Destination</TableHead>
                        </>
                      )}
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isFranchisor ? 7 : 5} className="h-24 text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            <div>{format(new Date(transaction.created_at), 'yyyy-MM-dd')}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(transaction.created_at), 'HH:mm:ss')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(getTransactionTypeColor(transaction.transaction_type))}>
                              {formatTransactionType(transaction.transaction_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.inventory_items?.name || 'Unknown Item'}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.quantity}
                          </TableCell>
                          {isFranchisor && (
                            <>
                              <TableCell>
                                {transaction.source_franchise?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {transaction.destination_franchise?.name || 'N/A'}
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            {formatCurrency(transaction.quantity * transaction.retail_price)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'lowStock' && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('name')}>
                          Name
                          {sortField === 'name' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('sku')}>
                          SKU/Barcode
                          {sortField === 'sku' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('quantity')}>
                          Current Qty
                          {sortField === 'quantity' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('min_stock_level')}>
                          Min Qty
                          {sortField === 'min_stock_level' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      {isFranchisor && (
                        <TableHead>Franchise</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLowStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isFranchisor ? 7 : 6} className="h-24 text-center">
                          No low stock items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <div>SKU: {item.sku}</div>
                            <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>
                          </TableCell>
                          <TableCell>{item.category?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.min_stock_level || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(getStatusColor(item.status))}>
                              {formatStatus(item.status)}
                            </Badge>
                          </TableCell>
                          {isFranchisor && (
                            <TableCell>
                              {franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'expiring' && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('name')}>
                          Name
                          {sortField === 'name' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('sku')}>
                          SKU/Barcode
                          {sortField === 'sku' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('quantity')}>
                          Quantity
                          {sortField === 'quantity' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 font-medium" onClick={() => handleSort('expiry_date')}>
                          Expiry Date
                          {sortField === 'expiry_date' && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Days Left</TableHead>
                      {isFranchisor && (
                        <TableHead>Franchise</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpiringItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isFranchisor ? 7 : 6} className="h-24 text-center">
                          No expiring items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpiringItems.map((item) => {
                        const daysUntilExpiry = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
                        let expiryBadgeClass = '';
                        
                        if (daysUntilExpiry !== null) {
                          if (daysUntilExpiry <= 7) {
                            expiryBadgeClass = 'bg-red-100 text-red-800 hover:bg-red-100';
                          } else if (daysUntilExpiry <= 14) {
                            expiryBadgeClass = 'bg-amber-100 text-amber-800 hover:bg-amber-100';
                          } else {
                            expiryBadgeClass = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
                          }
                        }
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <div>SKU: {item.sku}</div>
                              <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>
                            </TableCell>
                            <TableCell>{item.category?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>
                              {item.expiry_date ? format(parseISO(item.expiry_date), 'yyyy-MM-dd') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {daysUntilExpiry !== null ? (
                                <Badge variant="outline" className={cn(expiryBadgeClass)}>
                                  {daysUntilExpiry} days
                                </Badge>
                              ) : 'N/A'}
                            </TableCell>
                            {isFranchisor && (
                              <TableCell>
                                {franchises.find(f => f.id === item.franchise_id)?.name || 'N/A'}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}