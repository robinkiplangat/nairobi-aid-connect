import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { ActionPanel } from '@/components/ActionPanel';
import { HelpRequestModal } from '@/components/HelpRequestModal';
import { VolunteerModal } from '@/components/VolunteerModal';
import { ChatInterface } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

export interface MapHotspotData {
  id: string;
  coordinates: { lat: number; lng: number };
  request_type: 'Medical' | 'Legal' | 'Shelter';
  timestamp: string;
}

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
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
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

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/notifications`;
    notificationWs.current = new WebSocket(wsUrl);
    notificationWs.current.onopen = () => { console.log('Notification WS connected.'); toast({ title: "System", description: "Connected to live updates.", duration: 2000 }); };
    notificationWs.current.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data as string);
        console.log("Notification received:", rawMessage);
        if (rawMessage && rawMessage.chat_room_id && rawMessage.request_id) { // Assuming ChatSessionEstablished
          const chatData = rawMessage as ChatSessionEstablishedMessage;
          const currentRole = currentUserRoleInChat; // Use a local var for current role in this snapshot
          const localVolunteerId = currentVolunteerId; // Use local var
          const localMyLastRequestId = myLastRequestId; // Use local var

          console.log(`Processing ChatSessionEstablished: role=${currentRole}, volId=${localVolunteerId}, reqId=${localMyLastRequestId}`);
          console.log(`ChatData: volId=${chatData.volunteer_id}, reqId=${chatData.request_id}`);


          if (currentRole === 'volunteer' && chatData.volunteer_id === localVolunteerId) {
            console.log(`Volunteer ${localVolunteerId} assigned to chat ${chatData.chat_room_id} for request ${chatData.request_id}`);
            setLiveChatRoomId(chatData.chat_room_id);
            setCurrentUserChatToken(chatData.volunteer_token);
          } else if (currentRole === 'requester' && chatData.request_id === localMyLastRequestId) {
            console.log(`Requester for request ${localMyLastRequestId} assigned to chat ${chatData.chat_room_id}`);
            setLiveChatRoomId(chatData.chat_room_id);
            setCurrentUserChatToken(chatData.requester_token);
          } else {
            console.log("ChatSessionEstablished message not for current user state.");
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
    if (isSelectingLocation && !isChatVisible) {
      setSelectedLocation(coordinates); setIsSelectingLocation(false);
      toast({ title: "Location Selected", description: "Now choose the type of help you need." });
    }
  }, [isSelectingLocation, toast, isChatVisible]);

  const handleNeedHelp = useCallback(() => {
    setSelectedLocation(null); setIsSelectingLocation(false); setShowHelpModal(true);
  }, []);

  const handleLocationSelect = useCallback(() => { setIsSelectingLocation(true); }, []);

  const handleHelpRequest = useCallback((type: 'Medical' | 'Legal' | 'Shelter') => {
    if (!selectedLocation) { toast({ title: "Location Required", description: "Please click on map.", variant: "destructive" }); return; }
    const payload = { request_type: type, coordinates: { lat: selectedLocation[0], lng: selectedLocation[1] }, original_content: `Direct app request for ${type}.` };
    fetch('/api/v1/request/direct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(async response => { const d = await response.json(); if (!response.ok) throw d; return d; })
    .then(data => {
      toast({ title: "Help Request Sent", description: "Waiting for volunteer." });
      setShowHelpModal(false); setSelectedLocation(null); setIsSelectingLocation(false);
      const newRequestId = data.details?.request_id;
      if (newRequestId) {
        setMyLastRequestId(newRequestId);
        setCurrentUserRoleInChat('requester');
        console.log(`Help request ${newRequestId} submitted. Waiting for notification.`);
      } else { console.error("No request_id in response."); toast({title: "Error", description: "Failed to get request ID.", variant: "destructive"}); }
    })
    .catch(error => { console.error('Failed to submit help request:', error); toast({ title: "Submission Failed", description: error.detail || error.message || "Could not submit.", variant: "destructive" }); });
  }, [selectedLocation, toast]);

  const handleProvideHelp = useCallback(() => {
    if (isVolunteer) { toast({ title: "You're already verified." }); } else { setShowVolunteerModal(true); }
  }, [isVolunteer, toast]);

  const handleVolunteerVerification = useCallback((code: string) => {
    const payload = { verification_code: code };
    fetch('/api/v1/volunteer/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
    if (!volunteerSessionToken) { toast({ title: "Auth Error", description: "Please verify again.", variant: "destructive" }); setIsVolunteer(false); setVolunteerSessionToken(null); setCurrentVolunteerId(null); setCurrentUserRoleInChat(null); return; }
    fetch(`/api/v1/request/${requestId}/accept`, { method: 'POST', headers: { 'Authorization': `Bearer ${volunteerSessionToken}` } })
    .then(async response => { const d = await response.json(); if (!response.ok) { if (response.status === 401) { setIsVolunteer(false); setVolunteerSessionToken(null); setCurrentVolunteerId(null); setCurrentUserRoleInChat(null); } throw d; } return d; })
    .then(data => {
      toast({ title: "Request Accepted by You", description: `Waiting for chat for request ${requestId}.` });
      setMapHotspots(prev => prev.filter(h => h.id !== requestId));
      console.log(`Accepted request ${requestId}. Waiting for chat notification. Details:`, data.details);
    })
    .catch(error => { console.error('Failed to accept request:', error); toast({ title: "Accept Failed", description: error.detail || error.message || "Could not accept.", variant: "destructive" }); });
  }, [toast, volunteerSessionToken, currentVolunteerId]);

  const handleCloseHelpModal = useCallback(() => { setShowHelpModal(false); setSelectedLocation(null); setIsSelectingLocation(false); }, []);
  const handleCloseVolunteerModal = useCallback(() => { setShowVolunteerModal(false); }, []);
  const handleCloseChat = useCallback(() => {
    setLiveChatRoomId(null); setCurrentUserChatToken(null); // Keep role or clear too? For now, keep.
    if (isVolunteer && volunteerSessionToken) { // Re-fetch hotspots for volunteer
      fetch('/api/v1/map/hotspots').then(r => r.json()).then(d => setMapHotspots(d)).catch(e => console.error("Re-fetch err", e));
    }
  }, [isVolunteer, volunteerSessionToken]);

  useEffect(() => { // Fetch map hotspots with polling
    let intervalId: NodeJS.Timeout | null = null;
    const fetchHotspots = () => {
      if (isVolunteer && volunteerSessionToken) { // Ensure volunteer is verified and has a session
        console.log("Polling for hotspots...");
        fetch('/api/v1/map/hotspots')
          .then(response => { if (!response.ok) { return response.json().then(err => { throw err; }); } return response.json(); })
          .then((data: MapHotspotData[]) => { setMapHotspots(data); /* console.log(`${data.length} hotspots loaded.`); */ })
          .catch(error => { console.error("Error polling hotspots:", error); /* Don't clear map on poll error */ });
      }
    };

    if (isVolunteer && volunteerSessionToken) {
      fetchHotspots(); // Initial fetch
      intervalId = setInterval(fetchHotspots, 30000); // Poll every 30 seconds
    } else {
      setMapHotspots([]); // Clear if not volunteer or no token
      if (intervalId) clearInterval(intervalId); // Clear interval if it was set
      // This case (isVolunteer true but no token) is handled by the notification WS useEffect dependency if needed
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isVolunteer, volunteerSessionToken]); // Removed toast from deps to avoid excessive toasts from polling

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <div className="w-full md:w-3/5 lg:w-2/3 h-1/2 md:h-full">
        <MapComponent hotspots={mapHotspots} onMapClick={handleMapClick} selectedLocation={selectedLocation} isVolunteer={isVolunteer} onAcceptRequest={handleAcceptRequest} isSelectingLocation={isSelectingLocation} mapIsInteractive={mapShouldBeInteractive} />
      </div>
      <div className="w-full md:w-2/5 lg:w-1/3 h-1/2 md:h-full bg-white shadow-lg flex flex-col overflow-y-auto">
        <ActionPanel onNeedHelp={handleNeedHelp} onProvideHelp={handleProvideHelp} isVolunteer={isVolunteer} />
      </div>
      <HelpRequestModal isOpen={showHelpModal} onClose={handleCloseHelpModal} onSubmit={handleHelpRequest} hasLocation={!!selectedLocation} onLocationSelect={handleLocationSelect} />
      <VolunteerModal isOpen={showVolunteerModal} onClose={handleCloseVolunteerModal} onVerify={handleVolunteerVerification} />
      <ChatInterface isVisible={isChatVisible} chatRoomId={liveChatRoomId} userToken={currentUserChatToken} userRole={currentUserRoleInChat} onClose={handleCloseChat} />
    </div>
  );
};
export default Index;
