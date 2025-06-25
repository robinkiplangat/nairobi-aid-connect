
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gavel, Home } from 'lucide-react';

interface HelpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'Medical' | 'Legal' | 'Shelter') => void;
  hasLocation: boolean;
}

export const HelpRequestModal: React.FC<HelpRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  hasLocation
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">What do you need?</DialogTitle>
        </DialogHeader>
        
        {!hasLocation ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Please click on the map to show your approximate location first.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Button
              onClick={() => onSubmit('Medical')}
              className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white"
            >
              <AlertTriangle className="w-6 h-6 mr-3" />
              Medical
            </Button>
            
            <Button
              onClick={() => onSubmit('Legal')}
              className="w-full h-16 text-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Gavel className="w-6 h-6 mr-3" />
              Legal
            </Button>
            
            <Button
              onClick={() => onSubmit('Shelter')}
              className="w-full h-16 text-lg bg-green-500 hover:bg-green-600 text-white"
            >
              <Home className="w-6 h-6 mr-3" />
              Shelter
            </Button>
            
            <Button onClick={onClose} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
