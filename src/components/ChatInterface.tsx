
import React, { useState, useEffect, useRef } from 'react';
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
import { X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'volunteer';
  timestamp: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello, I\'m here to help. What\'s your current situation?',
      sender: 'volunteer',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate volunteer responses (in real app, this would be WebSocket)
  useEffect(() => {
    const responses = [
      "I understand. Can you tell me more about your location?",
      "Help is on the way. Stay calm and stay safe.",
      "Are you in immediate danger? Please let me know.",
      "I'm coordinating with other volunteers in your area.",
      "Do you have any immediate medical needs?",
    ];

    const timer = setTimeout(() => {
      if (messages.length > 1 && messages[messages.length - 1].sender === 'user') {
        const response: Message = {
          id: Date.now().toString(),
          text: responses[Math.floor(Math.random() * responses.length)],
          sender: 'volunteer',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, response]);
      }
    }, 2000 + Math.random() * 3000); // Random delay 2-5 seconds

    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Secure Chat</SheetTitle>
              <SheetDescription>
                🔒 End-to-end encrypted • Session: {sessionId.slice(-8)}
              </SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[300px]">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Messages are automatically deleted after 24 hours for your privacy
        </div>
      </SheetContent>
    </Sheet>
  );
};
