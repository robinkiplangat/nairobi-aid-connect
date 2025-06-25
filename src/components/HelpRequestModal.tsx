
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [step, setStep] = useState<'location' | 'help-type'>('location');

  React.useEffect(() => {
    if (isOpen && !hasLocation) {
      setStep('location');
    } else if (isOpen && hasLocation) {
      setStep('help-type');
    }
  }, [isOpen, hasLocation]);

  const handleHelpTypeSelect = (type: 'Medical' | 'Legal' | 'Shelter') => {
    onSubmit(type);
    setStep('location'); // Reset for next time
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 'location' ? 'Select Your Location' : 'What do you need?'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {step === 'location' 
              ? 'Click on the map to show your approximate location for help to reach you'
              : 'Choose the type of assistance you need right now'
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'location' ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-gray-600 mb-4">
                Please click on the map to show your approximate location first.
              </p>
              <p className="text-sm text-gray-500">
                Your exact location will be obfuscated for privacy
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              Close and Select Location
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Button
              onClick={() => handleHelpTypeSelect('Medical')}
              className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white"
            >
              <AlertTriangle className="w-6 h-6 mr-3" />
              Medical Emergency
            </Button>
            
            <Button
              onClick={() => handleHelpTypeSelect('Legal')}
              className="w-full h-16 text-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Gavel className="w-6 h-6 mr-3" />
              Legal Assistance
            </Button>
            
            <Button
              onClick={() => handleHelpTypeSelect('Shelter')}
              className="w-full h-16 text-lg bg-green-500 hover:bg-green-600 text-white"
            >
              <Home className="w-6 h-6 mr-3" />
              Safe Shelter
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
