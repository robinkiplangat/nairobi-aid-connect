import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, WifiOff } from 'lucide-react'; // Added WifiOff for connection status
import { useToast } from '@/hooks/use-toast';


// Define message structure based on backend's broadcast_message
interface ChatMessage {
  id: string; // Use timestamp + random for client-side generated, or server-provided ID
  type: 'chat' | 'system' | 'error';
  text?: string; // For chat messages
  message?: string; // For system/error messages
  sender?: 'requester' | 'volunteer' | 'system'; // 'system' for system messages
  timestamp: string;
}

interface ChatInterfaceProps {
  chatRoomId: string | null; // Renamed from sessionId, can be null initially
  userToken: string | null;
  userRole: 'requester' | 'volunteer' | null; // To display self messages correctly
  onClose: () => void;
  isVisible: boolean; // To control Sheet's open state from parent
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatRoomId,
  userToken,
  userRole,
  onClose,
  isVisible
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const ws = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!chatRoomId || !userToken || !userRole || !isVisible) {
      // If essential props are missing or not visible, disconnect if connection exists
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const wsUrl = `${wsProtocol}://${backendHost}/ws/chat/${chatRoomId}/${userToken}`;

    ws.current = new WebSocket(wsUrl);
    setConnectionStatus(`Attempting to connect to ${chatRoomId.slice(-8)}...`);
    setIsConnected(false);
    // Clear old messages when new connection attempt starts
    // setMessages([]); // Optional: clear messages on new room connect

    ws.current.onopen = () => {
      console.log('WebSocket connected to:', wsUrl);
      setIsConnected(true);
      setConnectionStatus(`Connected as ${userRole}`);
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        message: 'Connection established.',
        sender: 'system',
        timestamp: new Date().toISOString(),
      });
    };

    ws.current.onmessage = (event) => {
      try {
        const receivedMsg = JSON.parse(event.data as string);
        // Assuming backend sends messages in ChatMessage structure or similar
        const newMsg: ChatMessage = {
          id: Date.now().toString() + Math.random(), // Simple unique ID for frontend list
          type: receivedMsg.type || 'chat',
          text: receivedMsg.text || receivedMsg.message,
          sender: receivedMsg.sender || 'system',
          timestamp: receivedMsg.timestamp || new Date().toISOString(),
        };
        addMessage(newMsg);
      } catch (error) {
        console.error('Error parsing received message or invalid format:', event.data, error);
        addMessage({
            id: Date.now().toString(),
            type: 'error',
            message: 'Received an unreadable message from server.',
            sender: 'system',
            timestamp: new Date().toISOString(),
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setConnectionStatus('Connection error.');
      addMessage({
        id: Date.now().toString(),
        type: 'error',
        message: 'Connection error. Please try again later.',
        sender: 'system',
        timestamp: new Date().toISOString(),
      });
      toast({ title: "Chat Error", description: "Could not connect to chat server.", variant: "destructive" });
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      if (event.code === 4001) { // Custom auth failure code from backend
        setConnectionStatus('Authentication failed. Invalid session.');
        addMessage({ id: Date.now().toString(), type: 'error', message: 'Chat session authentication failed.', sender: 'system', timestamp: new Date().toISOString() });
      } else if (event.wasClean) {
        setConnectionStatus('Disconnected.');
        addMessage({ id: Date.now().toString(), type: 'system', message: 'You have been disconnected.', sender: 'system', timestamp: new Date().toISOString() });
      } else {
        setConnectionStatus('Connection lost. Attempting to reconnect may be needed.');
         addMessage({ id: Date.now().toString(), type: 'error', message: 'Connection lost. Please check your internet.', sender: 'system', timestamp: new Date().toISOString() });
      }
      // Optionally, implement reconnect logic here
    };

    return () => {
      if (ws.current) {
        console.log('Closing WebSocket connection for chatRoomId:', chatRoomId);
        ws.current.close();
        ws.current = null;
      }
      setIsConnected(false);
      setConnectionStatus("Disconnected.");
    };
  }, [chatRoomId, userToken, userRole, addMessage, toast, isVisible]); // Effect dependencies

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      toast({ title: "Cannot Send", description: "Not connected to chat.", variant: "destructive"});
      return;
    }

    const messageToSend = {
      type: 'chat', // As per backend expectation for user messages
      text: newMessage,
    };

    ws.current.send(JSON.stringify(messageToSend));

    // Optimistically add user's own message to UI
    // Backend will broadcast it back, but this feels faster.
    // If backend confirms messages with IDs, could update/replace this later.
    addMessage({
      id: Date.now().toString(),
      type: 'chat',
      text: newMessage,
      sender: userRole || 'requester', // Assume current userRole if set
      timestamp: new Date().toISOString(),
    });
    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Sheet open={isVisible} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="h-[400px] sm:h-[70vh] flex flex-col"
                    onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing on outside click
                    onInteractOutside={(e) => e.preventDefault()} // For shadcn Dialog component behavior
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Secure Chat</SheetTitle>
              <SheetDescription className="flex items-center">
                {isConnected ?
                  `🔒 Connected to ${chatRoomId ? chatRoomId.slice(-8) : 'session'}` :
                  <><WifiOff className="w-4 h-4 mr-1 text-red-500" /> {connectionStatus}</>
                }
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0"> {/* Ensure this div allows shrinking and scrolling */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-3 pb-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === userRole ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                      message.sender === userRole
                        ? 'bg-blue-500 text-white'
                        : message.sender === 'system' || message.type === 'error'
                          ? 'bg-yellow-100 text-yellow-800 text-center w-full mx-auto text-xs'
                          : 'bg-gray-100 text-gray-900'
                    } ${message.type === 'system' || message.type === 'error' ? 'text-xs italic' : 'text-sm'}`}
                  >
                    {message.sender !== userRole && message.sender !== 'system' && message.type === 'chat' && (
                        <p className="text-xs font-semibold pb-0.5 capitalize">{message.sender}</p>
                    )}
                    <p>{message.text || message.message}</p>
                    <p className={`text-xs mt-1 opacity-80 ${
                      message.sender === userRole ? 'text-blue-100' : message.sender === 'system' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type your message..." : "Waiting for connection..."}
              className="flex-1"
              disabled={!isConnected}
            />
            <Button type="submit" disabled={!isConnected || !newMessage.trim()}>Send</Button>
          </form>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center pt-1">
          Chat history is not stored on the server. Session data expires after 24 hours.
        </div>
      </SheetContent>
    </Sheet>
  );
};
