import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gavel, Home, MapPin } from 'lucide-react';

interface HelpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'Medical' | 'Legal' | 'Shelter') => void;
  hasLocation: boolean;
  onLocationSelect: () => void;
}

export const HelpRequestModal: React.FC<HelpRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  hasLocation,
  onLocationSelect
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

  const handleLocationSelect = () => {
    onLocationSelect();
    // Don't close modal - let user continue with location selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md z-[200]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 'location' ? 'Select Your Location' : 'What do you need?'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {step === 'location' 
              ? 'First, we need to know your approximate location to send help'
              : 'Choose the type of assistance you need right now'
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'location' ? (
          <div className="text-center py-6">
            <div className="mb-6">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-gray-600 mb-4">
                Click the button below to select your location on the map.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Your exact location will be obfuscated for privacy
              </p>
              {hasLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Location selected! Now choose the type of help you need.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 After clicking "Select Location", click anywhere on the map to mark your position
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {!hasLocation ? (
                <Button 
                  onClick={handleLocationSelect}
                  className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Select Location on Map
                </Button>
              ) : (
                <Button 
                  onClick={() => setStep('help-type')}
                  className="w-full h-12 text-lg bg-green-500 hover:bg-green-600"
                >
                  Continue to Help Options
                </Button>
              )}
              
              <Button onClick={onClose} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
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
