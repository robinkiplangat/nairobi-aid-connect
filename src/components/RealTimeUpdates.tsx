import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Update {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export const RealTimeUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([
    {
      id: '1',
      time: '5m ago',
      message: 'Roadblock reported near Uhuru Park. Avoid the area.',
      type: 'warning'
    },
    {
      id: '2',
      time: '12m ago',
      message: 'Medical volunteers station established at All Saints Cathedral.',
      type: 'success'
    },
    {
      id: '3',
      time: '25m ago',
      message: 'Peaceful gathering reported along Kenyatta Avenue.',
      type: 'info'
    },
    {
      id: '4',
      time: '45m ago',
      message: 'Legal aid available. Check the Resource Hub for contact numbers.',
      type: 'info'
    },
    {
      id: '5',
      time: '1h ago',
      message: 'Water distribution point active at Jeevanjee Gardens.',
      type: 'success'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newUpdates = [
        'Safe zone established at City Hall.',
        'Mobile medical unit deployed to CBD area.',
        'Traffic advisory: Moi Avenue clear for passage.',
        'Volunteer coordination center active at KICC.',
        'Emergency supplies available at Central Park.'
      ];

      const randomUpdate: Update = {
        id: Date.now().toString(),
        time: 'Just now',
        message: newUpdates[Math.floor(Math.random() * newUpdates.length)],
        type: Math.random() > 0.7 ? 'warning' : Math.random() > 0.5 ? 'success' : 'info'
      };

      setUpdates(prev => [randomUpdate, ...prev.slice(0, 9)]); // Keep only 10 updates
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-orange-400 bg-orange-50';
      case 'success': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-blue-400 bg-blue-50';
    }
  };

  return (
    <ScrollArea className="h-full px-6 py-4">
      <div className="space-y-3">
        {updates.map((update) => (
          <div
            key={update.id}
            className={`border-l-4 p-3 rounded-r-lg ${getUpdateColor(update.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="mr-2">{getUpdateIcon(update.type)}</span>
                  <span className="text-xs text-gray-500 font-medium">{update.time}</span>
                </div>
                <p className="text-sm text-gray-800">{update.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
