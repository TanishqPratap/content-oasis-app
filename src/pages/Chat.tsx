
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import { MessageCircle } from 'lucide-react';

export default function Chat() {
  const { profile } = useAuth();
  const [selectedChat, setSelectedChat] = useState<{
    creatorId: string;
    creatorName: string;
    hourlyRate: number;
  } | null>(null);

  const handleStartChat = (creatorId: string, creatorName: string, hourlyRate: number) => {
    setSelectedChat({ creatorId, creatorName, hourlyRate });
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to access the chat feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-8 h-8" />
          Paid DM
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect with creators through private paid conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ChatList onStartChat={handleStartChat} />
        </div>
        <div>
          {selectedChat ? (
            <ChatWindow
              creatorId={selectedChat.creatorId}
              creatorName={selectedChat.creatorName}
              hourlyRate={selectedChat.hourlyRate}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="h-[600px] border rounded-lg flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Select a creator to start chatting</p>
                <p className="text-muted-foreground">
                  Choose from the available creators on the left to begin a paid conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
