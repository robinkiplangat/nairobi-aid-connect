import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmergencyContact {
  name: string;
  number: string;
}

interface DemoData {
  emergency_contacts: EmergencyContact[];
  safety_tips: string[];
  first_aid_basics: string[];
  legal_rights: string[];
}

export const ResourceHub: React.FC = () => {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        const response = await fetch('/api/demodata');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Assuming the API returns an array and we need the first element
        setDemoData(data[0]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!demoData) {
    return <div>No data available.</div>;
  }

  const { emergency_contacts: emergencyContacts, safety_tips: safetyTips, first_aid_basics: firstAidBasics, legal_rights: legalRights } = demoData;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Resource Hub
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white dark:bg-card">
        <SheetHeader>
          <SheetTitle className="dark:text-foreground">Resource Hub</SheetTitle>
          <SheetDescription className="dark:text-muted-foreground">
            Essential information and emergency contacts for Nairobi
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6">
            {/* Emergency Contacts */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Emergency Contacts</h3>
              <div className="space-y-2">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-background/50 rounded-lg">
                    <span className="font-medium dark:text-foreground">{contact.name}</span>
                    <a
                      href={`tel:${contact.number}`}
                      className="text-blue-600 dark:text-primary hover:text-blue-800 dark:hover:text-primary/90 font-mono"
                    >
                      {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Safety Tips</h3>
              <div className="space-y-2">
                {safetyTips.map((tip, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                    <span className="text-sm dark:text-blue-300">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* First Aid Basics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">First Aid Basics</h3>
              <div className="space-y-2">
                {firstAidBasics.map((step, index) => (
                  <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                    <span className="text-red-600 dark:text-red-400 mr-2 font-bold">{index + 1}.</span>
                    <span className="text-sm dark:text-red-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Rights */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Know Your Rights</h3>
              <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                <ul className="text-sm dark:text-green-300 space-y-2">
                  {legalRights.map((right, index) => (
                    <li key={index}>• {right}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
