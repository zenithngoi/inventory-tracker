import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivityLogger } from "@/hooks/use-activity-logger";
import { BarChart, PieChart } from "@/components/charts";
import { format } from "date-fns";

export default function DashboardPage() {
  const { getActivityLogs } = useActivityLogger();
  const [isLoading, setIsLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [itemData, setItemData] = useState<any[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get activity logs for charts
        const logs = await getActivityLogs({ limit: 100 });
        setActivityData(processActivityData(logs));
        setItemData(processItemData(logs));
        setUserActivityData(processUserActivityData(logs));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processActivityData = (logs: any[]) => {
    // Group activities by day
    const grouped = logs.reduce((acc: any, log: any) => {
      const day = format(new Date(log.timestamp), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day]++;
      return acc;
    }, {});

    // Convert to chart data format
    return Object.entries(grouped).map(([date, count]) => ({
      name: format(new Date(date), 'MMM dd'),
      value: count
    }));
  };

  const processItemData = (logs: any[]) => {
    // Group by item name
    const items = logs.reduce((acc: any, log: any) => {
      const itemName = log.item_name || 'Unknown Item';
      if (!acc[itemName]) {
        acc[itemName] = 0;
      }
      acc[itemName]++;
      return acc;
    }, {});

    // Convert to chart data and take top 5
    return Object.entries(items)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  };

  const processUserActivityData = (logs: any[]) => {
    // Group by user
    const users = logs.reduce((acc: any, log: any) => {
      const userName = log.user_name || log.user_email || 'Unknown User';
      if (!acc[userName]) {
        acc[userName] = 0;
      }
      acc[userName]++;
      return acc;
    }, {});

    // Convert to chart data
    return Object.entries(users)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  };

  return (
    <div className="container max-w-7xl py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Number of inventory actions per day</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <BarChart 
                data={activityData}
                xAxisKey="name"
                yAxisKey="value"
                barKey="value"
                barColor="#3b82f6"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Active Items</CardTitle>
              <CardDescription>Items with the most inventory changes</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <PieChart 
                data={itemData}
                nameKey="name"
                valueKey="value"
                colors={['#3b82f6', '#93c5fd', '#60a5fa', '#2563eb', '#1e40af']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Most active system users</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <BarChart 
                data={userActivityData}
                xAxisKey="name"
                yAxisKey="value"
                barKey="value"
                barColor="#10b981"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Current stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">USB Chargers</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '68%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">HDMI Cables</span>
                    <span className="text-sm font-medium">34%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '34%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Wireless Keyboards</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: '12%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bluetooth Speakers</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}