import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiUrl } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Update {
  update_id: string;
  title: string;
  summary: string;
  full_content?: string;
  timestamp: string;
  source?: string;
}

export const RealTimeUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch(apiUrl('/api/v1/content/updates'));
        if (!response.ok) throw new Error('Failed to fetch updates');
        const data = await response.json();
        setUpdates(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load updates');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const getUpdateType = (source?: string): 'info' | 'warning' | 'success' => {
    if (!source) return 'info';
    if (source.toLowerCase().includes('official')) return 'success';
    if (source.toLowerCase().includes('warning') || source.toLowerCase().includes('alert')) return 'warning';
    return 'info';
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-orange-400 bg-orange-50 dark:bg-orange-500/10';
      case 'success': return 'border-l-green-400 bg-green-50 dark:bg-green-500/10';
      default: return 'border-l-blue-400 bg-blue-50 dark:bg-blue-500/10';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <ScrollArea className="h-full px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs text-muted-foreground">Loading updates...</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea className="h-full px-6 py-4">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full px-6 py-4">
      {updates.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p className="text-sm">No updates available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => {
            const type = getUpdateType(update.source);
            return (
              <div
                key={update.update_id}
                className={`border-l-4 p-3 rounded-r-lg ${getUpdateColor(type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">{getUpdateIcon(type)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {formatTime(update.timestamp)}
                      </span>
                      {update.source && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {update.source}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-foreground mb-1">
                      {update.title}
                    </h4>
                    <p className="text-sm text-gray-800 dark:text-gray-300">{update.summary}</p>
                    {update.full_content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                        {update.full_content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
};

