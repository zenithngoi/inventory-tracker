import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function TransferPage() {
  const [activeTab, setActiveTab] = useState("pending");
  
  // Sample transfer data for demonstration
  const transfers = [
    { 
      id: "TR-1001", 
      source: "Warehouse A", 
      destination: "Franchise Store #12", 
      requestedBy: "John Doe",
      requestedDate: "2023-09-15",
      status: "pending",
      items: [
        { id: 1, name: "Coffee Beans", quantity: 10 },
        { id: 2, name: "Paper Cups", quantity: 500 },
      ]
    },
    { 
      id: "TR-1002", 
      source: "Warehouse B", 
      destination: "Franchise Store #08", 
      requestedBy: "Jane Smith",
      requestedDate: "2023-09-14",
      status: "approved",
      approvedBy: "Mike Johnson",
      approvedDate: "2023-09-15",
      items: [
        { id: 1, name: "Napkins", quantity: 1000 },
        { id: 2, name: "Sugar Packets", quantity: 200 },
      ]
    },
    { 
      id: "TR-1003", 
      source: "Warehouse A", 
      destination: "Franchise Store #23", 
      requestedBy: "David Williams",
      requestedDate: "2023-09-10",
      status: "completed",
      approvedBy: "Mike Johnson",
      approvedDate: "2023-09-11",
      completedDate: "2023-09-13",
      items: [
        { id: 1, name: "Paper Towels", quantity: 50 },
        { id: 2, name: "Hand Soap", quantity: 24 },
      ]
    },
    { 
      id: "TR-1004", 
      source: "Franchise Store #12", 
      destination: "Franchise Store #08", 
      requestedBy: "Sarah Brown",
      requestedDate: "2023-09-09",
      status: "rejected",
      approvedBy: "Mike Johnson",
      rejectedReason: "Insufficient inventory at source location",
      rejectedDate: "2023-09-10",
      items: [
        { id: 1, name: "Coffee Beans", quantity: 50 },
      ]
    },
  ];
  
  // Filter transfers based on active tab
  const filteredTransfers = transfers.filter(transfer => {
    if (activeTab === "all") return true;
    return transfer.status === activeTab;
  });
  
  // Get status badge based on transfer status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Approved</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Transfers</h1>
        <Button>New Transfer</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transfer Management</CardTitle>
          <CardDescription>Request and manage inventory transfers between locations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3 font-medium">Transfer ID</th>
                      <th className="p-3 font-medium">Source</th>
                      <th className="p-3 font-medium">Destination</th>
                      <th className="p-3 font-medium">Requested By</th>
                      <th className="p-3 font-medium">Requested Date</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((transfer) => (
                      <tr key={transfer.id} className="border-t">
                        <td className="p-3">{transfer.id}</td>
                        <td className="p-3">{transfer.source}</td>
                        <td className="p-3">{transfer.destination}</td>
                        <td className="p-3">{transfer.requestedBy}</td>
                        <td className="p-3">{transfer.requestedDate}</td>
                        <td className="p-3">{getStatusBadge(transfer.status)}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                    {filteredTransfers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No transfers found in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}