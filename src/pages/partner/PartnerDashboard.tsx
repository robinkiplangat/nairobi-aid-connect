import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Users, Clock, Settings, LogOut, UserPlus, Info, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ui/ThemeProvider';

const PartnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { theme, setTheme } = useTheme();

  // Mock data for demonstration
  const stats = {
    activeCases: 12,
    pendingRequests: 8,
    volunteers: 45,
    averageResponseTime: '3.2 min'
  };

  const recentCases = [
    { id: 1, type: 'Medical', location: 'Nairobi CBD', status: 'Active', time: '5 min ago', icon: AlertTriangle },
    { id: 2, type: 'Legal', location: 'Westlands', status: 'Pending', time: '15 min ago', icon: Users },
    { id: 3, type: 'Shelter', location: 'Kibera', status: 'Resolved', time: '45 min ago', icon: MapPin },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-700 border-red-200 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20';
      case 'Resolved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:border-border';
    }
  };

  return (
    <div 
      className={`min-h-screen relative ${theme === 'light' ? 'light-bg-image' : 'bg-background'}`}
    >
      {/* Header */}
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-blue-600 dark:text-primary">SOS Nairobi</h1>
              <span className="text-sm text-gray-500 dark:text-muted-foreground font-medium">Partner Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-primary"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Link to="/partner/volunteers">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Volunteers
                </Button>
              </Link>
              <Link to="/partner/settings">
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-primary">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-primary">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Dashboard Overview</h2>
          <p className="text-gray-600 dark:text-muted-foreground">Monitor emergency response activities and manage resources</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-gray-200/50 dark:border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Overview</TabsTrigger>
            <TabsTrigger value="cases" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Cases</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Analytics</TabsTrigger>
            <TabsTrigger value="resource-status" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Resource Status</TabsTrigger>
            <TabsTrigger value="team-availability" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Team Availability</TabsTrigger>
            <TabsTrigger value="collaboration-hub" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary">Collaboration Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Active Cases</CardTitle>
                  <div className="p-2 bg-red-50 dark:bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-destructive" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-foreground">{stats.activeCases}</div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">+2 from last hour</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Pending Requests</CardTitle>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-400/10 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-foreground">{stats.pendingRequests}</div>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">-1 from last hour</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Active Volunteers</CardTitle>
                  <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-foreground">{stats.volunteers}</div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">+5 from yesterday</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Avg Response Time</CardTitle>
                  <div className="p-2 bg-blue-50 dark:bg-primary/10 rounded-lg">
                    <Info className="h-4 w-4 text-blue-600 dark:text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-foreground">{stats.averageResponseTime}</div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">-0.5 min from avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Cases */}
            <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Recent Cases</CardTitle>
                <CardDescription className="text-gray-600 dark:text-muted-foreground">Latest emergency requests and their status</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-background/50 rounded-lg border border-gray-100/50 dark:border-border hover:bg-gray-50/70 dark:hover:bg-background/70 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm">
                          <case_.icon className="h-4 w-4 text-blue-600 dark:text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-foreground">{case_.type} Request</p>
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">{case_.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`font-medium border ${getStatusColor(case_.status)}`}>
                          {case_.status}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-muted-foreground">{case_.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link to="/partner/cases">
                    <Button variant="outline" className="w-full bg-white/80 dark:bg-card/80 hover:bg-white dark:hover:bg-card text-blue-600 dark:text-primary border-blue-200 dark:border-primary/50 hover:border-blue-300 dark:hover:border-primary">
                      View All Cases
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Case Management</CardTitle>
                <CardDescription className="text-gray-600 dark:text-muted-foreground">Manage and track all emergency cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-muted-foreground mb-4">Full case management interface</p>
                  <Link to="/partner/cases">
                    <Button className="bg-blue-600 dark:bg-primary hover:bg-blue-700 dark:hover:bg-primary/90 text-white dark:text-primary-foreground">Go to Case Management</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Analytics & Reports</CardTitle>
                <CardDescription className="text-gray-600 dark:text-muted-foreground">View detailed analytics and generate reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-muted-foreground mb-4">Analytics dashboard coming soon</p>
                  <Button variant="outline" disabled className="bg-white/80 dark:bg-card/80">View Analytics</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resource-status">
            <Link to="/partner/resource-status">
              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Resource Status</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-muted-foreground">Monitor available resources and equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Button className="bg-blue-600 dark:bg-primary hover:bg-blue-700 dark:hover:bg-primary/90 text-white dark:text-primary-foreground">Manage Resources</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="team-availability">
            <Link to="/partner/team-availability">
              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Team Availability</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-muted-foreground">View team schedules and availability status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Button className="bg-blue-600 dark:bg-primary hover:bg-blue-700 dark:hover:bg-primary/90 text-white dark:text-primary-foreground">View Team Status</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="collaboration-hub">
            <Link to="/partner/collaboration-hub">
              <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border hover:bg-white/95 dark:hover:bg-card/95 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Collaboration Hub</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-muted-foreground">Coordinate with other organizations and teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Button className="bg-blue-600 dark:bg-primary hover:bg-blue-700 dark:hover:bg-primary/90 text-white dark:text-primary-foreground">Open Collaboration Hub</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PartnerDashboard;
