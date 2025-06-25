
import React from 'react';
import { Button } from '@/components/ui/button';
import { RealTimeUpdates } from '@/components/RealTimeUpdates';
import { ResourceHub } from '@/components/ResourceHub';
import { AlertTriangle, Heart } from 'lucide-react';

interface ActionPanelProps {
  onNeedHelp: () => void;
  onProvideHelp: () => void;
  isVolunteer: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  onNeedHelp,
  onProvideHelp,
  isVolunteer
}) => {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SOS Nairobi</h1>
        <p className="text-gray-600">A secure platform for requesting and offering assistance.</p>
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-4">
        <Button
          onClick={onNeedHelp}
          className="w-full h-16 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
          size="lg"
        >
          <AlertTriangle className="w-6 h-6 mr-3" />
          I NEED HELP
        </Button>

        <Button
          onClick={onProvideHelp}
          className="w-full h-16 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
        >
          <Heart className="w-6 h-6 mr-3" />
          {isVolunteer ? '👮 I CAN PROVIDE HELP' : 'I CAN PROVIDE HELP'}
        </Button>

        {isVolunteer && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              ✅ Verified Volunteer
            </p>
            <p className="text-xs text-green-600">
              You can now view and respond to help requests on the map.
            </p>
          </div>
        )}
      </div>

      {/* Real-Time Updates */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Real-Time Updates</h2>
          <ResourceHub />
        </div>
        <div className="flex-1 overflow-hidden">
          <RealTimeUpdates />
        </div>
      </div>
    </div>
  );
};
