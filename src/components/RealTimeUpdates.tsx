import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Matches backend schemas.Update (simplified for display)
interface UpdateMessage {
  id: string; // update_id
  timestamp: string; // ISO string
  title: string; // Use as main message or header
  summary: string; // Use as main message or sub-text
  source?: string; // Can be used to determine type or display
  // type: 'info' | 'warning' | 'success'; // This was frontend-only, will derive or simplify
}

export const RealTimeUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<UpdateMessage[]>([]);
  const { toast } = useToast();

  const mapSourceToType = (source?: string): 'info' | 'warning' | 'success' => {
    const srcLower = source?.toLowerCase();
    if (srcLower?.includes('official') || srcLower?.includes('alert')) return 'warning';
    if (srcLower?.includes('ngo') || srcLower?.includes('community')) return 'success';
    return 'info';
  };

  const formatTimeAgo = (isoTimestamp: string) => {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };


  useEffect(() => {
    const fetchUpdates = () => {
      fetch('/api/v1/content/updates')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch updates');
          }
          return response.json();
        })
        .then((data: UpdateMessage[]) => {
          // Assuming data is sorted by timestamp descending from backend
          setUpdates(data.slice(0, 10)); // Keep only latest 10 for display
        })
        .catch(error => {
          console.error("Error fetching real-time updates:", error);
          // toast({ title: "Updates Error", description: "Could not load live updates.", variant: "destructive", duration: 3000 });
        });
    };

    fetchUpdates(); // Initial fetch
    const interval = setInterval(fetchUpdates, 60000); // Poll every 60 seconds

    return () => clearInterval(interval);
  }, [toast]);

  const getUpdateIcon = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getUpdateColor = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'warning': return 'border-l-orange-400 bg-orange-50';
      case 'success': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-blue-400 bg-blue-50';
    }
  };

  if (updates.length === 0) {
    return (
      <div className="h-full px-6 py-4 flex items-center justify-center">
        <p className="text-sm text-gray-500">No updates at the moment.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full px-6 py-4">
      <div className="space-y-3">
        {updates.map((update) => {
          const displayType = mapSourceToType(update.source);
          return (
            <div
              key={update.id} // Use update_id from backend
              className={`border-l-4 p-3 rounded-r-lg ${getUpdateColor(displayType)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="mr-2">{getUpdateIcon(displayType)}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatTimeAgo(update.timestamp)}
                    </span>
                    {update.source && <span className="ml-2 text-xs text-gray-400">({update.source})</span>}
                  </div>
                  <p className="text-sm text-gray-800 font-semibold">{update.title}</p>
                  <p className="text-sm text-gray-700">{update.summary}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
