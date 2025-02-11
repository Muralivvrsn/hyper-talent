import React, { useState, useMemo } from 'react';
import { useUserAction } from '../context/UserActionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Activity, Users, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';

const Dashboard = () => {
  const { data, loading, error } = useUserAction();
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  // Get unique actions and users
  const { uniqueActions, uniqueUsers } = useMemo(() => {
    if (loading || error) return { uniqueActions: [], uniqueUsers: [] };
    
    const actions = new Set();
    const users = new Set();
    
    Object.entries(data).forEach(([email, actions_array]) => {
      users.add(email);
      actions_array.forEach(action => actions.add(action.title));
    });

    return {
      uniqueActions: Array.from(actions),
      uniqueUsers: Array.from(users)
    };
  }, [data, loading, error]);

  // Process data for visualization
  const processedData = useMemo(() => {
    if (loading || error) return { chartData: [], tableData: [] };

    const actionCounts = {};
    const filteredData = [];

    Object.entries(data).forEach(([email, actions]) => {
      if (selectedUser === 'all' || email === selectedUser) {
        actions.forEach(action => {
          if (selectedAction === 'all' || action.title === selectedAction) {
            const date = new Date(action.timestamp).toLocaleDateString();
            actionCounts[date] = (actionCounts[date] || 0) + 1;
            filteredData.push({
              ...action,
              email,
              formattedDate: new Date(action.timestamp).toLocaleString()
            });
          }
        });
      }
    });

    const chartData = Object.entries(actionCounts).map(([date, count]) => ({
      date,
      count
    }));

    return {
      chartData: chartData.sort((a, b) => new Date(a.date) - new Date(b.date)),
      tableData: filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
  }, [data, selectedAction, selectedUser, loading, error]);

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const LoadingCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px]" />
      </CardContent>
    </Card>
  );

  const LoadingTable = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">User Actions Dashboard</h1>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
            <Select 
              value={selectedUser} 
              onValueChange={setSelectedUser}
              disabled={loading}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedAction} 
              onValueChange={setSelectedAction}
              disabled={loading}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{processedData.tableData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(processedData.tableData.map(d => d.email)).size}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Time Range</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {processedData.tableData.length > 0 
                      ? `${new Date(processedData.tableData[processedData.tableData.length - 1].timestamp).toLocaleDateString()} - ${new Date(processedData.tableData[0].timestamp).toLocaleDateString()}`
                      : 'No data'}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#666" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Action Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <LoadingTable />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.tableData.map((action, index) => (
                          <TableRow key={index}>
                            <TableCell>{action.formattedDate}</TableCell>
                            <TableCell>{action.email}</TableCell>
                            <TableCell>{action.title}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;