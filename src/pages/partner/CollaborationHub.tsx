import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft, Users, MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ui/ThemeProvider';

const CollaborationHub = () => {
  const { theme } = useTheme();

  const organizations = [
    { id: 1, name: 'Red Cross Kenya', status: 'Active', members: 12, lastContact: '2 hours ago', type: 'Medical' },
    { id: 2, name: 'Legal Aid Network', status: 'Available', members: 8, lastContact: '30 min ago', type: 'Legal' },
    { id: 3, name: 'Community Shelter Org', status: 'Busy', members: 6, lastContact: '1 hour ago', type: 'Shelter' },
    { id: 4, name: 'Emergency Response Team', status: 'Active', members: 15, lastContact: '10 min ago', type: 'Emergency' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20';
      case 'Available': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20';
      case 'Busy': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20';
      case 'Offline': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:border-border';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:border-border';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Medical': return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500';
      case 'Legal': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500';
      case 'Shelter': return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500';
      case 'Emergency': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500';
      default: return 'bg-gray-50 text-gray-600 dark:bg-secondary dark:text-secondary-foreground';
    }
  };

  return (
    <div className={`min-h-screen relative ${theme === 'light' ? 'light-bg-image' : 'bg-background'}`}>
      {/* Header */}
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/partner/dashboard" className="text-blue-600 dark:text-primary hover:text-blue-500 font-medium flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Collaboration Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Link to="/partner/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-primary">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Collaboration Hub</h2>
          <p className="text-gray-600 dark:text-muted-foreground">Coordinate with other organizations and emergency response teams</p>
        </div>

        {/* Collaboration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Partner Organizations</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-foreground">4</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Active Collaborations</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">2</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Shared Resources</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">15</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Joint Operations</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">3</div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Organizations */}
        <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Partner Organizations</CardTitle>
            <CardDescription className="text-gray-600 dark:text-muted-foreground">Connected organizations and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-background/50 rounded-lg border border-gray-100/50 dark:border-border hover:bg-gray-50/70 dark:hover:bg-background/70 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(org.type)}`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-foreground">{org.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-muted-foreground">
                        <span>{org.members} members</span>
                        <span>•</span>
                        <span>Last contact {org.lastContact}</span>
                        <span>•</span>
                        <span className="capitalize">{org.type} focus</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`font-medium border ${getStatusColor(org.status)}`}>
                      {org.status}
                    </Badge>
                    <Button variant="outline" size="sm" className="bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80">
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CollaborationHub;
