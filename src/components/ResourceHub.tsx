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
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// Matches backend schemas.Resource
interface ResourceItem {
  resource_id: string;
  title: string;
  content: string; // Could be plain text, markdown, or simple HTML. Assume plain text for now.
  category: string;
  last_updated: string; // ISO string
}

interface GroupedResources {
  [category: string]: ResourceItem[];
}

export const ResourceHub: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [groupedResources, setGroupedResources] = useState<GroupedResources>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && resources.length === 0 && !isLoading && !error) { // Fetch only if open and not already fetched/loading/errored
      setIsLoading(true);
      setError(null);
      fetch('/api/v1/content/resources')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch resources');
          }
          return response.json();
        })
        .then((data: ResourceItem[]) => {
          setResources(data);
          // Group resources by category
          const grouped = data.reduce((acc, resource) => {
            const category = resource.category || 'Other';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(resource);
            return acc;
          }, {} as GroupedResources);
          setGroupedResources(grouped);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching resources:", err);
          setError(err.message || "Could not load resources.");
          setIsLoading(false);
          toast({ title: "Resources Error", description: "Could not load resources.", variant: "destructive" });
        });
    }
  }, [isOpen, resources.length, isLoading, error, toast]);

  const renderContent = (content: string) => {
    // Basic check for simple list-like content
    if (content.includes('\\n- ')) {
        return (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {content.split('\\n- ').map((item, index) => item.trim() && <li key={index}>{item.trim().replace(/^- /, '')}</li>)}
            </ul>
        );
    }
    // TODO: Could add markdown parsing here if content is markdown
    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>;
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Resource Hub
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Resource Hub</SheetTitle>
          <SheetDescription>
            Essential information and emergency contacts.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 mt-6 pr-3"> {/* Added pr-3 for scrollbar */}
          {isLoading && <p>Loading resources...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && Object.keys(groupedResources).length === 0 && (
            <p>No resources available at the moment.</p>
          )}

          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedResources).map(([category, items]) => (
              <AccordionItem value={category} key={category}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  {category} ({items.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {items.map((resource) => (
                      <div key={resource.resource_id} className="p-3 bg-gray-50 rounded-lg shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-1">{resource.title}</h4>
                        {renderContent(resource.content)}
                        <p className="text-xs text-gray-400 mt-2">
                          Last updated: {new Date(resource.last_updated).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
