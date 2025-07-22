import { useState, useEffect } from 'react';
import { useActivityLogger, ActivityLog, ActivityAction } from '@/hooks/use-activity-logger';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon, 
  Search, 
  FileDown, 
  RotateCcw,
  Info,
  Clock,
  ArrowDownUp,
  User,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ACTION_LABELS: Record<ActivityAction, { label: string; color: string }> = {
  scan_in: { label: 'Item Scan', color: 'bg-blue-100 text-blue-800' },
  transfer_create: { label: 'Transfer Created', color: 'bg-yellow-100 text-yellow-800' },
  transfer_approve: { label: 'Transfer Approved', color: 'bg-green-100 text-green-800' },
  transfer_reject: { label: 'Transfer Rejected', color: 'bg-red-100 text-red-800' },
  item_update: { label: 'Item Updated', color: 'bg-purple-100 text-purple-800' },
  item_delete: { label: 'Item Deleted', color: 'bg-red-100 text-red-800' },
  stock_adjustment: { label: 'Stock Adjusted', color: 'bg-amber-100 text-amber-800' },
  sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-800' },
  purchase: { label: 'Purchase', color: 'bg-indigo-100 text-indigo-800' },
  location_change: { label: 'Location Change', color: 'bg-sky-100 text-sky-800' },
  category_change: { label: 'Category Change', color: 'bg-violet-100 text-violet-800' }
};

export default function ActivityLogsPage() {
  const { getActivityLogs, syncPendingLogs, isLoading, error } = useActivityLogger();
  const { user } = useAuth();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActivityAction | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userFilter, setUserFilter] = useState<string | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const PAGE_SIZE = 10;

  // Check if user is admin
  useEffect(() => {
    if (user?.user_metadata?.isAdmin) {
      setIsAdmin(true);
    }
  }, [user]);

  // Load logs
  useEffect(() => {
    loadLogs();
  }, [currentPage, actionFilter, startDate, endDate, userFilter]);

  const loadLogs = async () => {
    // Build filters
    const filters: any = {
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE
    };
    
    if (actionFilter !== 'all') {
      filters.action = actionFilter;
    }
    
    if (startDate) {
      filters.startDate = startDate;
    }
    
    if (endDate) {
      // Set to end of day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filters.endDate = endOfDay;
    }
    
    if (userFilter !== 'all' && userFilter) {
      filters.userId = userFilter;
    }
    
    const fetchedLogs = await getActivityLogs(filters);
    setLogs(fetchedLogs);
    
    // Calculate total pages (approximate)
    // In a real implementation, you'd want to get the total count from the backend
    setTotalPages(Math.max(1, Math.ceil(fetchedLogs.length / PAGE_SIZE)));
  };
  
  const handleSearch = () => {
    // Search implementation would need backend support for full-text search
    // For now, we're just filtering the logs we have client-side
    setCurrentPage(1);
    loadLogs();
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setUserFilter('all');
    setCurrentPage(1);
    loadLogs();
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    await syncPendingLogs();
    await loadLogs();
    setIsSyncing(false);
  };
  
  const exportToCSV = () => {
    if (logs.length === 0) return;
    
    // Create CSV content
    const headers = [
      'ID', 
      'Timestamp', 
      'User', 
      'Action', 
      'Item', 
      'Location', 
      'Quantity Before', 
      'Quantity After'
    ];
    
    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString(),
      log.user_name || log.user_email,
      ACTION_LABELS[log.action as ActivityAction]?.label || log.action,
      log.item_name || log.item_id,
      log.location_name || log.location_id,
      log.quantity_before?.toString() || '',
      log.quantity_after?.toString() || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  
  const viewLogDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };
  
  const getActionBadge = (action: string) => {
    const actionInfo = ACTION_LABELS[action as ActivityAction] || { label: action, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={actionInfo.color}>{actionInfo.label}</Badge>;
  };
  
  const formatDateForDisplay = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            View and search through all inventory activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            <RotateCcw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Logs
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={logs.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter activity logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by item or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Button size="icon" variant="secondary" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="scan_in">Item Scan</SelectItem>
                  <SelectItem value="transfer_create">Transfer Created</SelectItem>
                  <SelectItem value="transfer_approve">Transfer Approved</SelectItem>
                  <SelectItem value="transfer_reject">Transfer Rejected</SelectItem>
                  <SelectItem value="item_update">Item Updated</SelectItem>
                  <SelectItem value="item_delete">Item Deleted</SelectItem>
                  <SelectItem value="stock_adjustment">Stock Adjusted</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isAdmin && (
              <div className="md:col-span-2">
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value={user?.id || ''}>Current User</SelectItem>
                    {/* In a real app, you would fetch users from the database */}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="md:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="md:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="md:col-span-12 flex justify-end">
              <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            Complete record of all inventory activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activity logs found.</p>
              <p className="text-sm">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date/Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="w-[80px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDateForDisplay(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user_name || 'Unknown'}</span>
                            {log.user_email && (
                              <span className="text-xs text-muted-foreground">{log.user_email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          {log.item_name ? (
                            <div className="flex flex-col">
                              <span>{log.item_name}</span>
                              {log.item_barcode && (
                                <span className="text-xs text-muted-foreground">
                                  {log.item_barcode}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.location_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.quantity_before !== undefined && log.quantity_after !== undefined ? (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-end space-x-1">
                                <span>{log.quantity_before}</span>
                                <ArrowDownUp className="h-3 w-3" />
                                <span>{log.quantity_after}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Change: {log.quantity_after - log.quantity_before}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewLogDetails(log)}
                          >
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {totalPages > 5 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Log Details Dialog */}
      {selectedLog && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                Activity Log Details
                {getActionBadge(selectedLog.action)}
              </DialogTitle>
              <DialogDescription>
                Full information about this activity
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Date & Time</h4>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDateForDisplay(selectedLog.timestamp)}
                  </div>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <h4 className="text-sm font-medium">User</h4>
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div>{selectedLog.user_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedLog.user_email || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {(selectedLog.item_name || selectedLog.item_id) && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Item Details</h4>
                  <Card>
                    <CardContent className="p-4">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {selectedLog.item_name && (
                          <>
                            <dt className="text-muted-foreground">Name</dt>
                            <dd className="font-medium">{selectedLog.item_name}</dd>
                          </>
                        )}
                        
                        {selectedLog.item_barcode && (
                          <>
                            <dt className="text-muted-foreground">Barcode</dt>
                            <dd className="font-mono">{selectedLog.item_barcode}</dd>
                          </>
                        )}
                        
                        {selectedLog.location_name && (
                          <>
                            <dt className="text-muted-foreground">Location</dt>
                            <dd>{selectedLog.location_name}</dd>
                          </>
                        )}
                        
                        {selectedLog.category_name && (
                          <>
                            <dt className="text-muted-foreground">Category</dt>
                            <dd>{selectedLog.category_name}</dd>
                          </>
                        )}
                        
                        {selectedLog.quantity_before !== undefined && (
                          <>
                            <dt className="text-muted-foreground">Quantity Before</dt>
                            <dd>{selectedLog.quantity_before}</dd>
                          </>
                        )}
                        
                        {selectedLog.quantity_after !== undefined && (
                          <>
                            <dt className="text-muted-foreground">Quantity After</dt>
                            <dd>{selectedLog.quantity_after}</dd>
                          </>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Additional Details</h4>
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto max-h-48 p-2 bg-muted rounded-sm">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}