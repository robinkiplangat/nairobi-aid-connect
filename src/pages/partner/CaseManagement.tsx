import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CaseList from '@/components/case/CaseList';
import CaseDetails from '@/components/case/CaseDetails';
import { Case } from '@/types/case';
import { useTheme } from '@/components/ui/ThemeProvider';

const CaseManagement = () => {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const { theme } = useTheme();

  // Mock data for cases
  const cases: Case[] = [
    {
      id: 1,
      type: 'Medical',
      status: 'Active',
      location: 'Nairobi CBD',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      requestedAt: '2024-01-15 14:30',
      description: 'Individual needs immediate medical attention',
      volunteer: 'Dr. Sarah Mwangi',
      priority: 'High'
    },
    {
      id: 2,
      type: 'Legal',
      status: 'Pending',
      location: 'Westlands',
      coordinates: { lat: -1.2676, lng: 36.8062 },
      requestedAt: '2024-01-15 14:18',
      description: 'Legal assistance required for detainee',
      volunteer: null,
      priority: 'Medium'
    },
    {
      id: 3,
      type: 'Shelter',
      status: 'Resolved',
      location: 'Kibera',
      coordinates: { lat: -1.3133, lng: 36.7892 },
      requestedAt: '2024-01-15 13:45',
      description: 'Safe shelter needed urgently',
      volunteer: 'John Kamau',
      priority: 'High'
    }
  ];

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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Case Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80">
                Export Cases
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Emergency Cases</h2>
          <p className="text-gray-600 dark:text-muted-foreground">Monitor and manage emergency requests and volunteer assignments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CaseList 
              cases={cases}
              selectedCase={selectedCase}
              onSelectCase={setSelectedCase}
            />
          </div>

          <div className="lg:col-span-1">
            <CaseDetails 
              selectedCase={selectedCase}
              cases={cases}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseManagement;
