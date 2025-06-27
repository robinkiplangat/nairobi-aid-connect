import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ui/ThemeProvider';

const TeamAvailability = () => {
  const { theme } = useTheme();

  const teamMembers = [
    { id: 1, name: 'Dr. Sarah Mwangi', role: 'Medical Officer', status: 'Available', location: 'Nairobi CBD', shiftEnd: '18:00' },
    { id: 2, name: 'John Kamau', role: 'Legal Advisor', status: 'On Call', location: 'Westlands', shiftEnd: '20:00' },
    { id: 3, name: 'Mary Wanjiku', role: 'Coordinator', status: 'Available', location: 'Kibera', shiftEnd: '17:30' },
    { id: 4, name: 'Peter Ochieng', role: 'Emergency Response', status: 'Busy', location: 'Eastlands', shiftEnd: '22:00' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20';
      case 'On Call': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20';
      case 'Busy': return 'bg-red-100 text-red-700 border-red-200 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20';
      case 'Off Duty': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:border-border';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-secondary dark:text-secondary-foreground dark:border-border';
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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Team Availability</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80">
                Schedule Shifts
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Team Availability</h2>
          <p className="text-gray-600 dark:text-muted-foreground">Monitor team schedules and availability status</p>
        </div>

        {/* Availability Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">2</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">On Call</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">1</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Busy</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600 dark:text-destructive">1</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Off Duty</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-600 dark:text-muted-foreground">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Team Members</CardTitle>
            <CardDescription className="text-gray-600 dark:text-muted-foreground">Current availability status of all team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-background/50 rounded-lg border border-gray-100/50 dark:border-border hover:bg-gray-50/70 dark:hover:bg-background/70 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm">
                      <Users className="h-4 w-4 text-blue-600 dark:text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-foreground">{member.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-muted-foreground">
                        <span>{member.role}</span>
                        <span>•</span>
                        <span>{member.location}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Until {member.shiftEnd}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge className={`font-medium border ${getStatusColor(member.status)}`}>
                    {member.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeamAvailability;
