import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your franchise inventory management dashboard
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory Items
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M4 19V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
                <path d="M6 9h12"/>
                <path d="m9 16 3-3 3 3"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Transfers
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +3 pending approvals
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                +7 new since last week
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent inventory management activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center">
                <div className="mr-3 rounded-full bg-blue-100 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Added 24 new inventory items</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-center">
                <div className="mr-3 rounded-full bg-green-100 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Approved transfer #3892</p>
                  <p className="text-sm text-muted-foreground">Yesterday at 3:12 PM</p>
                </div>
              </li>
              <li className="flex items-center">
                <div className="mr-3 rounded-full bg-amber-100 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                    <path d="m13 2-2 2.5h3L12 7"/>
                    <path d="M10 9v7.5"/>
                    <path d="M14 9v7.5"/>
                    <path d="M10 16.5c0 .8.7 1.5 1.5 1.5h1c.8 0 1.5-.7 1.5-1.5v0"/>
                    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/>
                    <path d="M15 6v3"/>
                    <path d="M9 6v3"/>
                    <path d="M12 6v3"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Updated inventory categories</p>
                  <p className="text-sm text-muted-foreground">Sep 21 at 9:26 AM</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}