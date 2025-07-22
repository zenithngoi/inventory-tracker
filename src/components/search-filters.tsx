import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ItemStatus } from "@/types";
import { categoryOptions, locationOptions } from "@/lib/inventory-data";
import { Search, X } from "lucide-react";

interface SearchFilters {
  search: string;
  status: string;
  category: string;
  location: string;
}

interface SearchFiltersProps {
  onFilter: (filters: SearchFilters) => void;
}

export function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    status: "all-statuses",
    category: "all-categories",
    location: "all-locations",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const clearFilters = () => {
    const resetFilters = {
      search: "",
      status: "all-statuses",
      category: "all-categories",
      location: "all-locations",
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  const hasActiveFilters = 
    filters.search || 
    (filters.status && filters.status !== "all-statuses") || 
    (filters.category && filters.category !== "all-categories") || 
    (filters.location && filters.location !== "all-locations");

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:flex-1">
              <Input
                name="search"
                placeholder="Search by name or barcode"
                value={filters.search}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={filters.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="imported">Imported</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="defective">Defective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={filters.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={filters.location}
                onValueChange={(value) => handleSelectChange("location", value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="submit" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Filter Results
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}