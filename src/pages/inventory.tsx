import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Sample inventory data for demonstration
  const inventoryItems = [
    { id: 1, name: "Paper Towels", barcode: "4002359871", category: "Supplies", quantity: 245, location: "Warehouse A" },
    { id: 2, name: "Hand Soap", barcode: "4002359872", category: "Supplies", quantity: 120, location: "Warehouse B" },
    { id: 3, name: "Coffee Beans", barcode: "4002359873", category: "Food", quantity: 50, location: "Warehouse A" },
    { id: 4, name: "Napkins", barcode: "4002359874", category: "Supplies", quantity: 430, location: "Warehouse C" },
    { id: 5, name: "Sugar Packets", barcode: "4002359875", category: "Food", quantity: 850, location: "Warehouse B" },
  ];
  
  // Filter inventory based on search and category
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm);
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <Button>Add New Item</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>View and manage your inventory items across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Barcode</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Quantity</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.barcode}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{item.location}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No inventory items found. Try adjusting your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}