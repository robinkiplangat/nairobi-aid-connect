
import React, { useState } from 'react';
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
  const { toast } = useToast();

  const handleMapClick = (coordinates: [number, number]) => {
    if (showHelpModal) {
      setSelectedLocation(coordinates);
    }
  };

  const handleHelpRequest = (type: 'Medical' | 'Legal' | 'Shelter') => {
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

    // Start chat session for help seeker
    const sessionId = `session_${Date.now()}`;
    setActiveChatSession(sessionId);

    toast({
      title: "Help Request Sent",
      description: "A volunteer will contact you securely in this window.",
    });
  };

  const handleVolunteerVerification = (code: string) => {
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
  };

  const handleAcceptRequest = (requestId: string) => {
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
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Map Section - 60% width */}
      <div className="w-3/5 relative">
        <MapComponent 
          helpRequests={helpRequests}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          isVolunteer={isVolunteer}
          onAcceptRequest={handleAcceptRequest}
        />
      </div>

      {/* Action Panel - 40% width */}
      <div className="w-2/5 border-l border-border">
        <ActionPanel
          onNeedHelp={() => setShowHelpModal(true)}
          onProvideHelp={() => setShowVolunteerModal(true)}
          isVolunteer={isVolunteer}
        />
      </div>

      {/* Modals */}
      <HelpRequestModal
        isOpen={showHelpModal}
        onClose={() => {
          setShowHelpModal(false);
          setSelectedLocation(null);
        }}
        onSubmit={handleHelpRequest}
        hasLocation={!!selectedLocation}
      />

      <VolunteerModal
        isOpen={showVolunteerModal}
        onClose={() => setShowVolunteerModal(false)}
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
