import React, { useState, useEffect } from 'react';
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
import { apiUrl } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

interface DemoData {
  emergency_contacts: Array<{ name: string; number: string }>;
  safety_tips: string[];
  first_aid_basics: string[];
  legal_rights: string[];
}

interface Resource {
  resource_id: string;
  title: string;
  content: string;
  category: string;
  last_updated: string;
}

export const ResourceHub: React.FC = () => {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [demoResponse, resourceResponse] = await Promise.all([
          fetch(apiUrl('/api/demodata')),
          fetch(apiUrl('/api/v1/content/resources'))
        ]);

        if (!demoResponse.ok || !resourceResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const demoDataArray = await demoResponse.json();
        const resourcesData = await resourceResponse.json();

        if (Array.isArray(demoDataArray) && demoDataArray.length > 0) {
          setDemoData(demoDataArray[0]);
        }
        setResources(resourcesData || []);
      } catch (err) {
        console.error('Error fetching resource hub data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const emergencyContacts = demoData?.emergency_contacts || [];
  const safetyTips = demoData?.safety_tips || [];
  const firstAidBasics = demoData?.first_aid_basics || [];
  const legalRights = demoData?.legal_rights || [];

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

        {loading && (
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading resources...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 mt-6 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-6">
              {/* Emergency Contacts */}
              {emergencyContacts.length > 0 && (
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
              )}

              {/* Safety Tips */}
              {safetyTips.length > 0 && (
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
              )}

              {/* First Aid Basics */}
              {firstAidBasics.length > 0 && (
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
              )}

              {/* Legal Rights */}
              {legalRights.length > 0 && (
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
              )}

              {/* Additional Resources */}
              {resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Additional Resources</h3>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource.resource_id} className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/20">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm dark:text-purple-300">{resource.title}</h4>
                          <span className="text-xs bg-purple-200 dark:bg-purple-600 text-purple-800 dark:text-purple-100 px-2 py-1 rounded">
                            {resource.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{resource.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
};

