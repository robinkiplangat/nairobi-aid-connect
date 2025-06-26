import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapComponent, ZoneStatusData } from '@/components/MapComponent'; // Import ZoneStatusData
import { ActionPanel } from '@/components/ActionPanel';
import { HelpRequestModal } from '@/components/HelpRequestModal';
import { VolunteerModal } from '@/components/VolunteerModal';
import { ChatInterface } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { apiUrl } from '@/lib/utils';

export interface MapHotspotData {
  id: string;
  coordinates: { lat: number; lng: number };
  request_type: 'Medical' | 'Legal' | 'Shelter';
  timestamp: string;
}

type HelpType = 'Medical' | 'Legal' | 'Shelter'; // Re-usable type

interface ChatSessionEstablishedMessage {
  type: "ChatSessionEstablished";
  chat_room_id: string;
  assignment_id: string;
  request_id: string;
  volunteer_id: string;
  requester_token: string;
  volunteer_token: string;
  timestamp: string;
}

const Index = () => {
  const [mapHotspots, setMapHotspots] = useState<MapHotspotData[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false); // For map interaction state
  const { toast } = useToast();

  const [volunteerSessionToken, setVolunteerSessionToken] = useState<string | null>(null);
  const [currentVolunteerId, setCurrentVolunteerId] = useState<string | null>(null);
  const [myLastRequestId, setMyLastRequestId] = useState<string | null>(null);

  const [liveChatRoomId, setLiveChatRoomId] = useState<string | null>(null);
  const [currentUserChatToken, setCurrentUserChatToken] = useState<string | null>(null);
  const [currentUserRoleInChat, setCurrentUserRoleInChat] = useState<'requester' | 'volunteer' | null>(null);

  const isChatVisible = !!liveChatRoomId;
  const mapShouldBeInteractive = !showHelpModal && !showVolunteerModal && !isChatVisible;

  const notificationWs = useRef<WebSocket | null>(null);

  // Mock zone data - this will be passed to MapComponent
  // Later, this could be fetched from an API
  const [currentZoneData, setCurrentZoneData] = useState<ZoneStatusData[]>([
    { name: 'CBD', lat: -1.2921, lng: 36.8219, status: 'danger', intensity: 0.8 },
    { name: 'Westlands', lat: -1.2676, lng: 36.8062, status: 'moderate', intensity: 0.6 },
    { name: 'Kibera', lat: -1.3133, lng: 36.7892, status: 'calm', intensity: 0.3 },
    { name: 'Parklands', lat: -1.2632, lng: 36.8103, status: 'moderate', intensity: 0.5 },
    { name: 'Industrial Area', lat: -1.3031, lng: 36.8073, status: 'danger', intensity: 0.9 },
    { name: 'Gigiri', lat: -1.2507, lng: 36.8673, status: 'calm', intensity: 0.2 },
    { name: 'Karen', lat: -1.2741, lng: 36.7540, status: 'moderate', intensity: 0.4 }, // Corrected spelling
    { name: 'Muthaiga', lat: -1.2195, lng: 36.8965, status: 'calm', intensity: 0.1 },
    { name: 'South B', lat: -1.3152, lng: 36.8302, status: 'danger', intensity: 0.7 },
    { name: 'Hurlingham', lat: -1.2841, lng: 36.8155, status: 'moderate', intensity: 0.5 },
  ]);

  // Notification WebSocket useEffect (as before)
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const wsUrl = `${wsProtocol}://${backendHost}/ws/notifications`;
    notificationWs.current = new WebSocket(wsUrl);
    notificationWs.current.onopen = () => { console.log('Notification WS connected.'); toast({ title: "System", description: "Connected to live updates.", duration: 2000 }); };
    notificationWs.current.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data as string);
        if (rawMessage && rawMessage.chat_room_id && rawMessage.request_id) {
          const chatData = rawMessage as ChatSessionEstablishedMessage;
          const currentRole = currentUserRoleInChat;
          const localVolunteerId = currentVolunteerId;
          const localMyLastRequestId = myLastRequestId;

          if (currentRole === 'volunteer' && chatData.volunteer_id === localVolunteerId) {
            setLiveChatRoomId(chatData.chat_room_id); setCurrentUserChatToken(chatData.volunteer_token);
          } else if (currentRole === 'requester' && chatData.request_id === localMyLastRequestId) {
            setLiveChatRoomId(chatData.chat_room_id); setCurrentUserChatToken(chatData.requester_token);
          }
        } else if (rawMessage.type === 'system') {
            toast({ title: "System Notification", description: rawMessage.message, duration: 3000});
        }
      } catch (error) { console.error('Error processing notification message:', event.data, error); }
    };
    notificationWs.current.onerror = (error) => { console.error('Notification WS error:', error); toast({ title: "Update Service Error", description: "Disconnected.", variant: "destructive" }); };
    notificationWs.current.onclose = () => { console.log('Notification WS disconnected.'); };
    return () => { if (notificationWs.current) notificationWs.current.close(); };
  }, [myLastRequestId, currentVolunteerId, currentUserRoleInChat, toast]);


  const handleMapClick = useCallback((coordinates: [number, number]) => {
    if (isSelectingLocation && showHelpModal && !isChatVisible) { // Ensure help modal is open for this action
      setSelectedLocation(coordinates);
      setIsSelectingLocation(false); // Location picked, map no longer needs to be in "selection mode" for this interaction
      toast({ title: "Location Pin Dropped", description: "Location marked on the map." });
    }
  }, [isSelectingLocation, showHelpModal, toast, isChatVisible]);

  // Called when "I NEED HELP" is clicked
  const handleNeedHelp = useCallback(() => {
    setSelectedLocation(null);      // Reset location when modal opens
    setIsSelectingLocation(false);  // Reset map selection mode
    setMyLastRequestId(null);       // Reset previous request ID
    setCurrentUserRoleInChat(null); // Reset role if any previous chat
    setLiveChatRoomId(null);        // Ensure any existing chat is closed
    setCurrentUserChatToken(null);
    setShowHelpModal(true);
  }, []);

  // Called by HelpRequestModal when it needs the user to pick a location on the map.
  const handleModalRequestsLocationSelection = useCallback(() => {
    setIsSelectingLocation(true); // Enable map click in `handleMapClick`
    toast({ title: "Select Location", description: "Please tap your approximate location on the map." });
  }, [toast]);

  // New callback for when device GPS location is set by the modal
  const handleDeviceLocationSet = useCallback((coordinates: [number, number]) => {
    setSelectedLocation(coordinates);
    setIsSelectingLocation(false); // Location is set, no longer in "map selection mode"
    // Toast is handled by the modal for GPS success/failure
  }, []);

  // This is now the final submission from HelpRequestModal, called AFTER type and location are confirmed.
  // The modal passes the selected 'type'. 'selectedLocation' is already in Index.tsx's state.
  const handleModalSubmitRequest = useCallback((type: HelpType) => {
    if (!selectedLocation) {
      toast({ title: "Location Required", description: "Please select a location on the map first.", variant: "destructive" });
      // This case should ideally be prevented by HelpRequestModal's logic (button disabled if locationSelected is false)
      // but good to have a fallback.
      setIsSelectingLocation(true); // Re-prompt for location
      return;
    }

    console.log('Finalizing help request. Type:', type, 'Location:', selectedLocation);
    const payload = {
      request_type: type,
      coordinates: { lat: selectedLocation[0], lng: selectedLocation[1] },
      original_content: `Direct app request for ${type} assistance. Location selected via map.`,
    };

    fetch(apiUrl('/api/v1/request/direct'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(async response => { const d = await response.json(); if (!response.ok) throw d; return d; })
    .then(data => {
      toast({ title: "Help Request Sent", description: "Your request has been received. Waiting for a volunteer." });
      setShowHelpModal(false);
      // selectedLocation and isSelectingLocation are reset when modal closes (handleCloseHelpModal) or when new request starts.

      const newRequestId = data.details?.request_id;
      if (newRequestId) {
        setMyLastRequestId(newRequestId);
        setCurrentUserRoleInChat('requester');
        console.log(`Help request ${newRequestId} submitted. Waiting for chat notification via WebSocket.`);
      } else {
        console.error("No request_id received in direct request response.");
        toast({title: "Error", description: "Failed to get request ID for tracking.", variant: "destructive"});
      }
    })
    .catch(error => {
      console.error('Failed to submit help request:', error);
      toast({ title: "Submission Failed", description: error.detail || error.message || "Could not submit your request.", variant: "destructive" });
    });
  }, [selectedLocation, toast]);


  const handleProvideHelp = useCallback(() => {
    if (isVolunteer) { toast({ title: "You're already verified." }); } else { setShowVolunteerModal(true); }
  }, [isVolunteer, toast]);

  const handleVolunteerVerification = useCallback((code: string) => {
    const payload = { verification_code: code };
    fetch(apiUrl('/api/v1/volunteer/verify'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(async response => { const d = await response.json(); if (!response.ok || !d.success) throw d; return d; })
    .then(data => {
      if (data.details?.session_token && data.details?.volunteer_id) {
        setVolunteerSessionToken(data.details.session_token);
        setCurrentVolunteerId(data.details.volunteer_id);
        setIsVolunteer(true);
        setCurrentUserRoleInChat('volunteer');
        setShowVolunteerModal(false);
        toast({ title: "Verification Successful", description: data.message || "Ready." });
      } else { throw new Error("Token/ID missing."); }
    })
    .catch(error => {
      console.error('Failed to verify volunteer:', error);
      setVolunteerSessionToken(null); setCurrentVolunteerId(null); setIsVolunteer(false); setCurrentUserRoleInChat(null);
      toast({ title: "Verification Failed", description: error.message || error.detail || "Could not verify.", variant: "destructive" });
    });
  }, [toast]);

  const handleAcceptRequest = useCallback((requestId: string) => {
    if (!volunteerSessionToken) { /* ... error handling ... */ return; }
    fetch(apiUrl(`/api/v1/request/${requestId}/accept`), { method: 'POST', headers: { 'Authorization': `Bearer ${volunteerSessionToken}` } })
    .then(async response => { const d = await response.json(); if (!response.ok) { if (response.status === 401) { /* reset states */ } throw d; } return d; })
    .then(data => {
      toast({ title: "Request Accepted by You", description: `Waiting for chat for request ${requestId}.` });
      setMapHotspots(prev => prev.filter(h => h.id !== requestId));
      // Chat will be initiated by notificationWS message for the volunteer
      console.log(`Accepted request ${requestId}. Waiting for chat notification. Details from accept:`, data.details);
    })
    .catch(error => { /* ... */ });
  }, [toast, volunteerSessionToken, currentVolunteerId]); // currentVolunteerId might not be needed if not used inside

  const handleCloseHelpModal = useCallback(() => {
    setShowHelpModal(false);
    setSelectedLocation(null); // Reset location when modal is closed
    setIsSelectingLocation(false); // Reset map selection mode
  }, []);
  const handleCloseVolunteerModal = useCallback(() => { setShowVolunteerModal(false); }, []);
  const handleCloseChat = useCallback(() => {
    setLiveChatRoomId(null); setCurrentUserChatToken(null); // User role can be kept or cleared based on desired flow post-chat
    if (isVolunteer && volunteerSessionToken) {
      fetch(apiUrl('/api/v1/map/hotspots')).then(r => r.json()).then(d => setMapHotspots(d)).catch(e => console.error("Re-fetch err", e));
    }
  }, [isVolunteer, volunteerSessionToken]);

  useEffect(() => { // Fetch map hotspots with polling
    let intervalId: NodeJS.Timeout | null = null;
    const fetchHotspots = () => { /* ... */ }; // as before
    if (isVolunteer && volunteerSessionToken) {
      fetchHotspots();
      intervalId = setInterval(fetchHotspots, 30000);
    } else {
      setMapHotspots([]);
      if (intervalId) clearInterval(intervalId);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isVolunteer, volunteerSessionToken]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <div className="w-full md:w-3/5 lg:w-2/3 h-1/2 md:h-full">
        <MapComponent
          hotspots={mapHotspots}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          isVolunteer={isVolunteer}
          onAcceptRequest={handleAcceptRequest}
          isSelectingLocation={isSelectingLocation}
          mapIsInteractive={mapShouldBeInteractive}
          zoneData={currentZoneData} // Pass the zoneData as a prop
        />
      </div>
      <div className="w-full md:w-2/5 lg:w-1/3 h-1/2 md:h-full bg-white shadow-lg flex flex-col overflow-y-auto">
        <ActionPanel onNeedHelp={handleNeedHelp} onProvideHelp={handleProvideHelp} isVolunteer={isVolunteer} />
      </div>
      <HelpRequestModal
        isOpen={showHelpModal}
        onClose={handleCloseHelpModal}
        onLocationSelectRequest={handleModalRequestsLocationSelection}
        onSubmitRequest={handleModalSubmitRequest}
        locationSelected={!!selectedLocation} // Pass boolean indicating if location is selected
        onDeviceLocationSet={handleDeviceLocationSet} // Pass the new callback
      />
      <VolunteerModal isOpen={showVolunteerModal} onClose={handleCloseVolunteerModal} onVerify={handleVolunteerVerification} />
      <ChatInterface isVisible={isChatVisible} chatRoomId={liveChatRoomId} userToken={currentUserChatToken} userRole={currentUserRoleInChat} onClose={handleCloseChat} />
    </div>
  );
};
export default Index;
