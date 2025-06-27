import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, Shield, Bell, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (section: string) => {
    setIsLoading(true);
    // Mock save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    console.log(`Saved ${section} settings`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm border-b dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/partner/dashboard" className="text-blue-600 dark:text-primary hover:text-blue-500 dark:hover:text-primary/90">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-card">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Manage your organization's information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input id="org-name" defaultValue="Red Cross Kenya" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Organization Type</Label>
                    <Input id="org-type" defaultValue="NGO" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Primary Contact Email</Label>
                  <Input id="contact-email" type="email" defaultValue="admin@sos-nairobi.org" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input id="contact-phone" defaultValue="+254 700 000 000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="Nairobi, Kenya" />
                </div>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    onClick={() => handleSave('profile')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Change Password</h4>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                        <Badge variant="outline" className="mt-1">Not Configured</Badge>
                      </div>
                      <Button variant="outline" size="sm">Enable 2FA</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Session Management</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border dark:border-border rounded">
                        <div>
                          <p className="text-sm font-medium">Current Session</p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">Chrome on Windows • Last active: Now</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      View All Sessions
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    onClick={() => handleSave('security')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Update Security'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Emergency Alerts</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">High-priority emergency notifications</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Case Updates</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">Updates on case status changes</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Volunteer Activity</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">Notifications about volunteer assignments</p>
                    </div>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">System Updates</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">Platform maintenance and feature updates</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Notification Methods</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SMS Notifications</span>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Push Notifications</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button 
                    onClick={() => handleSave('notifications')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage API keys for integrating with external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border dark:border-border rounded">
                    <div>
                      <h4 className="font-medium">Production API Key</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">Last used: 2 hours ago</p>
                      <code className="text-xs bg-gray-100 dark:bg-background px-2 py-1 rounded mt-1 inline-block">
                        sk_prod_***************************xyz
                      </code>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Regenerate</Button>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border dark:border-border rounded">
                    <div>
                      <h4 className="font-medium">Development API Key</h4>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">Last used: Never</p>
                      <code className="text-xs bg-gray-100 dark:bg-background px-2 py-1 rounded mt-1 inline-block">
                        sk_dev_***************************abc
                      </code>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Regenerate</Button>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New API Key
                </Button>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">API Usage Guidelines</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Keep your API keys secure and never share them publicly</li>
                    <li>• Use different keys for development and production environments</li>
                    <li>• Regenerate keys regularly for security</li>
                    <li>• Monitor API usage through the dashboard</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
