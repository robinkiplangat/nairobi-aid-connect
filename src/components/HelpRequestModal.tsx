import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gavel, Home, MapPin, CheckCircle2, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type HelpType = 'Medical' | 'Legal' | 'Shelter';

interface HelpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelectRequest: () => void;
  onSubmitRequest: (type: HelpType) => void;
  locationSelected: boolean;
  onDeviceLocationSet: (coordinates: [number, number]) => void;
}

export const HelpRequestModal: React.FC<HelpRequestModalProps> = ({
  isOpen,
  onClose,
  onLocationSelectRequest,
  onSubmitRequest,
  locationSelected,
  onDeviceLocationSet,
}) => {
  const [currentStep, setCurrentStep] = useState<'selectType' | 'selectLocation'>('selectType');
  const [selectedType, setSelectedType] = useState<HelpType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selectType');
      setSelectedType(null);
    }
  }, [isOpen]);

  const handleTypeSelect = (type: HelpType) => {
    setSelectedType(type);
    setCurrentStep('selectLocation');
  };

  const handleLocationAction = () => {
    if (locationSelected && selectedType) {
      onSubmitRequest(selectedType);
    } else if (selectedType) {
      onLocationSelectRequest();
    }
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }
    toast({ title: "Fetching Location...", description: "Please wait.", duration: 4000 });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onDeviceLocationSet([latitude, longitude]);
        toast({ title: "Location Found!", description: "Your current location has been set.", variant: "success" });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "Could not retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) message = "Location permission denied.";
        else if (error.code === error.POSITION_UNAVAILABLE) message = "Location information unavailable.";
        else if (error.code === error.TIMEOUT) message = "Geolocation request timed out.";
        toast({ title: "Geolocation Error", description: message, variant: "destructive" });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const renderSelectTypeStep = () => (
    <div className="space-y-4 py-4">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">What do you need?</DialogTitle>
        <DialogDescription className="text-center text-gray-600">Choose the type of assistance you require.</DialogDescription>
      </DialogHeader>
      <Button onClick={() => handleTypeSelect('Medical')} className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white">
        <AlertTriangle className="w-6 h-6 mr-3" /> Medical Emergency
      </Button>
      <Button onClick={() => handleTypeSelect('Legal')} className="w-full h-16 text-lg bg-blue-500 hover:bg-blue-600 text-white">
        <Gavel className="w-6 h-6 mr-3" /> Legal Assistance
      </Button>
      <Button onClick={() => handleTypeSelect('Shelter')} className="w-full h-16 text-lg bg-green-500 hover:bg-green-600 text-white">
        <Home className="w-6 h-6 mr-3" /> Safe Shelter
      </Button>
      <DialogFooter className="pt-2">
        <Button onClick={onClose} variant="outline" className="w-full">Cancel</Button>
      </DialogFooter>
    </div>
  );

  const renderSelectLocationStep = () => (
    <div className="text-center py-6">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">Select Your Location</DialogTitle>
        <DialogDescription className="text-center text-gray-600">
          Help Type: <span className="font-semibold">{selectedType}</span>. Now, please indicate your location.
        </DialogDescription>
      </DialogHeader>
      <div className="my-6">
        <div className="text-4xl mb-3">📍</div>
        <p className="text-gray-600 mb-2">
          {locationSelected ? "Location selected on the map." : "Tap on the map or use your device's GPS."}
        </p>
        <p className="text-sm text-gray-500 mb-4">Your exact location is obfuscated for privacy by the system.</p>
        {locationSelected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800 font-medium flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" /> Location Marked!
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleLocationAction}
          className={`w-full h-12 text-lg ${locationSelected && selectedType ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          disabled={!selectedType}
        >
          {locationSelected && selectedType ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <MapPin className="w-5 h-5 mr-2" />}
          {locationSelected && selectedType ? 'Submit Help Request' : 'Select/Change Location on Map'}
        </Button>

        {!locationSelected && selectedType && (
            <Button
                onClick={handleUseDeviceLocation}
                variant="outline"
                className="w-full h-12 text-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
            >
                <LocateFixed className="w-5 h-5 mr-2" /> Use My Current Location (GPS)
            </Button>
        )}

        <Button onClick={() => setCurrentStep('selectType')} variant="ghost" className="w-full text-sm">
            Change Help Type ({selectedType})
        </Button>
        <Button onClick={onClose} variant="outline" className="w-full">Cancel</Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md z-[200]" onInteractOutside={(e) => e.preventDefault()}>
        {currentStep === 'selectType' ? renderSelectTypeStep() : renderSelectLocationStep()}
      </DialogContent>
    </Dialog>
  );
};
