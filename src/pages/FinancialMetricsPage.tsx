import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type DateRangeType = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
type ChartType = 'sales' | 'inventory' | 'profit';

type MetricData = {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalItems: number;
  averageTicket: number;
  topProducts: {
    name: string;
    revenue: number;
    quantity: number;
  }[];
  dailySales: {
    date: string;
    sales: number;
    cost: number;
    profit: number;
  }[];
  categorySales: {
    category: string;
    value: number;
  }[];
  franchisePerformance: {
    name: string;
    sales: number;
    profit: number;
  }[];
  stockStatus: {
    status: string;
    count: number;
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinancialMetricsPage() {
  const { user, profile, isAdmin, isFranchisor } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [franchises, setFranchises] = useState<{ id: string; name: string }[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('last30days');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [activeTab, setActiveTab] = useState<ChartType>('sales');

  useEffect(() => {
    if (user) {
      fetchFranchises();
      updateDateRange(dateRange);
    }
  }, [user]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchMetrics();
    }
  }, [startDate, endDate, selectedFranchise]);

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
      case 'thisMonth':
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'custom':
        // Keep current dates and open the date picker
        setDatePickerOpen(true);
        break;
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Convert dates to ISO strings for the query
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      // Fetch sales transactions
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items(id, name, category_id, cost_price, retail_price),
          source_franchise:source_franchise_id(id, name),
          categories:inventory_items(category_id(id, name))
        `)
        .eq('transaction_type', 'sale')
        .gte('created_at', start)
        .lte('created_at', end);

      // Filter by franchise if selected
      if (selectedFranchise !== 'all') {
        query = query.eq('source_franchise_id', selectedFranchise);
      } else if (profile?.franchise_id && !isFranchisor) {
        // If user is franchisee, only show their franchise data
        query = query.eq('source_franchise_id', profile.franchise_id);
      }

      const { data: salesData, error: salesError } = await query;

      if (salesError) throw salesError;

      // Fetch inventory status data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('id, status, quantity, cost_price, retail_price')
        .order('updated_at', { ascending: false });

      if (inventoryError) throw inventoryError;

      // Process sales data
      const processedData = processSalesData(salesData || [], inventoryData || []);
      setMetrics(processedData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSalesData = (salesData: any[], inventoryData: any[]): MetricData => {
    // Initialize metrics object
    const metrics: MetricData = {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
      totalItems: 0,
      averageTicket: 0,
      topProducts: [],
      dailySales: [],
      categorySales: [],
      franchisePerformance: [],
      stockStatus: []
    };

    // Process sales transactions
    const productMap = new Map();
    const dailySalesMap = new Map();
    const categoryMap = new Map();
    const franchiseMap = new Map();

    // Calculate total sales metrics
    salesData.forEach(transaction => {
      const saleAmount = transaction.quantity * transaction.retail_price;
      const costAmount = transaction.quantity * transaction.cost_price;
      const profitAmount = saleAmount - costAmount;
      const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
      const franchiseName = transaction.source_franchise?.name || 'Unknown';
      const productName = transaction.inventory_items?.name || 'Unknown Product';
      const categoryName = transaction.categories?.name || 'Uncategorized';

      // Aggregate total metrics
      metrics.totalSales += saleAmount;
      metrics.totalCost += costAmount;
      metrics.totalProfit += profitAmount;
      metrics.totalItems += transaction.quantity;

      // Aggregate per product
      if (productMap.has(productName)) {
        const product = productMap.get(productName);
        product.revenue += saleAmount;
        product.quantity += transaction.quantity;
      } else {
        productMap.set(productName, {
          name: productName,
          revenue: saleAmount,
          quantity: transaction.quantity
        });
      }

      // Aggregate daily sales
      if (dailySalesMap.has(date)) {
        const dayData = dailySalesMap.get(date);
        dayData.sales += saleAmount;
        dayData.cost += costAmount;
        dayData.profit += profitAmount;
      } else {
        dailySalesMap.set(date, {
          date,
          sales: saleAmount,
          cost: costAmount,
          profit: profitAmount
        });
      }

      // Aggregate by category
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + saleAmount);
      } else {
        categoryMap.set(categoryName, saleAmount);
      }

      // Aggregate by franchise
      if (franchiseMap.has(franchiseName)) {
        const franchise = franchiseMap.get(franchiseName);
        franchise.sales += saleAmount;
        franchise.profit += profitAmount;
      } else {
        franchiseMap.set(franchiseName, {
          name: franchiseName,
          sales: saleAmount,
          profit: profitAmount
        });
      }
    });

    // Process inventory status
    const statusMap = new Map();
    inventoryData.forEach(item => {
      if (statusMap.has(item.status)) {
        statusMap.set(item.status, statusMap.get(item.status) + 1);
      } else {
        statusMap.set(item.status, 1);
      }
    });

    // Calculate average ticket size
    metrics.averageTicket = metrics.totalItems > 0 
      ? metrics.totalSales / metrics.totalItems 
      : 0;

    // Set derived data
    metrics.topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Convert daily sales map to array and sort by date
    metrics.dailySales = Array.from(dailySalesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Convert category map to array
    metrics.categorySales = Array.from(categoryMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    // Convert franchise map to array
    metrics.franchisePerformance = Array.from(franchiseMap.values())
      .sort((a, b) => b.sales - a.sales);

    // Convert status map to array
    metrics.stockStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }));

    return metrics;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const downloadReport = () => {
    if (!metrics) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add report header
    csvContent += `Financial Report: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n\n`;
    
    // Add summary metrics
    csvContent += "Summary Metrics\n";
    csvContent += `Total Sales,${metrics.totalSales}\n`;
    csvContent += `Total Cost,${metrics.totalCost}\n`;
    csvContent += `Total Profit,${metrics.totalProfit}\n`;
    csvContent += `Total Items Sold,${metrics.totalItems}\n`;
    csvContent += `Average Ticket Size,${metrics.averageTicket}\n\n`;
    
    // Add daily sales
    csvContent += "Daily Sales\n";
    csvContent += "Date,Sales,Cost,Profit\n";
    metrics.dailySales.forEach(day => {
      csvContent += `${day.date},${day.sales},${day.cost},${day.profit}\n`;
    });
    csvContent += "\n";
    
    // Add top products
    csvContent += "Top Products\n";
    csvContent += "Product,Revenue,Quantity\n";
    metrics.topProducts.forEach(product => {
      csvContent += `${product.name},${product.revenue},${product.quantity}\n`;
    });
    csvContent += "\n";
    
    // Add category sales
    csvContent += "Sales by Category\n";
    csvContent += "Category,Revenue\n";
    metrics.categorySales.forEach(category => {
      csvContent += `${category.category},${category.value}\n`;
    });
    csvContent += "\n";
    
    // Add franchise performance
    csvContent += "Franchise Performance\n";
    csvContent += "Franchise,Sales,Profit\n";
    metrics.franchisePerformance.forEach(franchise => {
      csvContent += `${franchise.name},${franchise.sales},${franchise.profit}\n`;
    });
    
    // Encode and download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to view financial metrics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Metrics</h1>
          <p className="text-muted-foreground">Track sales, inventory, and financial performance</p>
        </div>
        <Button variant="outline" onClick={downloadReport} disabled={!metrics}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={(value: DateRangeType) => updateDateRange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
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
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div>
          <Select 
            value={selectedFranchise} 
            onValueChange={setSelectedFranchise}
            disabled={!isFranchisor}
          >
            <SelectTrigger>
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sales</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(metrics.totalSales)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Profit</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(metrics.totalProfit)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Items Sold</CardDescription>
                <CardTitle className="text-2xl">{metrics.totalItems}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Ticket</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(metrics.averageTicket)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="sales">Sales Performance</TabsTrigger>
              <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>Daily sales over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metrics.dailySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best selling products by revenue</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.topProducts}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                    <CardDescription>Revenue distribution by product category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.categorySales}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="category"
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {metrics.categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {isFranchisor && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Franchise Performance</CardTitle>
                      <CardDescription>Sales comparison across franchises</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.franchisePerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profit">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profit vs. Revenue</CardTitle>
                    <CardDescription>Comparison of sales and profit over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metrics.dailySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
                        <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit Margin</CardTitle>
                    <CardDescription>Daily profit margin percentage</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metrics.dailySales.map(day => ({
                          date: day.date,
                          margin: day.sales > 0 ? (day.profit / day.sales) * 100 : 0
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                        <Line 
                          type="monotone" 
                          dataKey="margin" 
                          stroke="#ff7300" 
                          name="Profit Margin %" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {isFranchisor && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Franchise Profit Comparison</CardTitle>
                      <CardDescription>Profit contribution by franchise</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.franchisePerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Status</CardTitle>
                    <CardDescription>Current inventory status distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.stockStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ status, percent }) => {
                            const displayStatus = status === 'in_stock' ? 'In Stock' :
                                               status === 'low_stock' ? 'Low Stock' :
                                               status === 'out_of_stock' ? 'Out of Stock' : status;
                            return `${displayStatus}: ${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {metrics.stockStatus.map((entry, index) => {
                            let color;
                            switch(entry.status) {
                              case 'in_stock': color = '#4caf50'; break;
                              case 'low_stock': color = '#ff9800'; break;
                              case 'out_of_stock': color = '#f44336'; break;
                              default: color = COLORS[index % COLORS.length];
                            }
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No financial data available for the selected period. Try selecting a different date range or franchise.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}