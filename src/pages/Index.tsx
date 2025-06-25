
import React, { useState, useCallback } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { ActionPanel } from '@/components/ActionPanel';
import { HelpRequestModal } from '@/components/HelpRequestModal';
import { VolunteerModal } from '@/components/VolunteerModal';
import { ChatInterface } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

export interface HelpRequest {
  id: string;
  type: 'Medical' | 'Legal' | 'Shelter';
  location: [number, number];
  timestamp: string;
  status: 'active' | 'assigned';
}

const Index = () => {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const { toast } = useToast();

  const handleMapClick = useCallback((coordinates: [number, number]) => {
    console.log('Map clicked:', coordinates, 'selecting location:', isSelectingLocation);
    
    if (isSelectingLocation) {
      setSelectedLocation(coordinates);
      setIsSelectingLocation(false);
      
      toast({
        title: "Location Selected",
        description: "Now choose the type of help you need.",
      });
    }
  }, [isSelectingLocation, toast]);

  const handleNeedHelp = useCallback(() => {
    console.log('Need help clicked');
    setSelectedLocation(null);
    setIsSelectingLocation(true);
    setShowHelpModal(true);
  }, []);

  const handleHelpRequest = useCallback((type: 'Medical' | 'Legal' | 'Shelter') => {
    console.log('Help request submitted:', type, 'location:', selectedLocation);
    
    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please click on the map to select your approximate location.",
        variant: "destructive"
      });
      return;
    }

    // Obfuscate location for privacy (add random offset within ~500m)
    const obfuscatedLocation: [number, number] = [
      selectedLocation[0] + (Math.random() - 0.5) * 0.009, // ~500m offset
      selectedLocation[1] + (Math.random() - 0.5) * 0.009
    ];

    const newRequest: HelpRequest = {
      id: Date.now().toString(),
      type,
      location: obfuscatedLocation,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    setHelpRequests(prev => [...prev, newRequest]);
    setShowHelpModal(false);
    setSelectedLocation(null);
    setIsSelectingLocation(false);

    // Start chat session for help seeker
    const sessionId = `session_${Date.now()}`;
    setActiveChatSession(sessionId);

    toast({
      title: "Help Request Sent",
      description: "A volunteer will contact you securely in this window.",
    });
  }, [selectedLocation, toast]);

  const handleProvideHelp = useCallback(() => {
    console.log('Provide help clicked, is volunteer:', isVolunteer);
    if (isVolunteer) {
      toast({
        title: "You're already verified",
        description: "Click on any help request on the map to assist.",
      });
    } else {
      setShowVolunteerModal(true);
    }
  }, [isVolunteer, toast]);

  const handleVolunteerVerification = useCallback((code: string) => {
    console.log('Volunteer verification attempted with code:', code);
    
    // Simple verification - in production this would call the backend
    const validCodes = ['VOLUNTEER2024', 'MEDIC123', 'LEGAL456'];
    
    if (validCodes.includes(code)) {
      setIsVolunteer(true);
      setShowVolunteerModal(false);
      toast({
        title: "Verification Successful",
        description: "You can now view and respond to help requests.",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "Please check your verification code and try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleAcceptRequest = useCallback((requestId: string) => {
    console.log('Request accepted:', requestId);
    
    setHelpRequests(prev => 
      prev.filter(req => req.id !== requestId)
    );
    
    // Start chat session for volunteer
    const sessionId = `session_${requestId}_volunteer`;
    setActiveChatSession(sessionId);

    toast({
      title: "Request Accepted",
      description: "You can now communicate with the person in need.",
    });
  }, [toast]);

  const handleCloseHelpModal = useCallback(() => {
    console.log('Closing help modal');
    setShowHelpModal(false);
    setSelectedLocation(null);
    setIsSelectingLocation(false);
  }, []);

  const handleCloseVolunteerModal = useCallback(() => {
    console.log('Closing volunteer modal');
    setShowVolunteerModal(false);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      {/* Map Section */}
      <div className="w-full md:w-3/5 lg:w-2/3 h-1/2 md:h-full">
        <MapComponent
          helpRequests={helpRequests}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          isVolunteer={isVolunteer}
          onAcceptRequest={handleAcceptRequest}
          isSelectingLocation={isSelectingLocation}
        />
      </div>

      {/* Action Panel */}
      <div className="w-full md:w-2/5 lg:w-1/3 h-1/2 md:h-full bg-white shadow-lg flex flex-col overflow-y-auto">
        <ActionPanel
          onNeedHelp={handleNeedHelp}
          onProvideHelp={handleProvideHelp}
          isVolunteer={isVolunteer}
        />
      </div>

      {/* Modals */}
      <HelpRequestModal
        isOpen={showHelpModal}
        onClose={handleCloseHelpModal}
        onSubmit={handleHelpRequest}
        hasLocation={!!selectedLocation}
      />

      <VolunteerModal
        isOpen={showVolunteerModal}
        onClose={handleCloseVolunteerModal}
        onVerify={handleVolunteerVerification}
      />

      {/* Chat Interface */}
      {activeChatSession && (
        <ChatInterface
          sessionId={activeChatSession}
          onClose={() => setActiveChatSession(null)}
        />
      )}
    </div>
  );
};

export default Index;
