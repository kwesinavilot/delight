import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ChatSession } from '@/types/chat';

interface ConversationSidebarProps {
  currentSessionId?: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadSessions();
    
    // Listen for session updates
    const handleSessionsUpdated = () => {
      loadSessions();
    };
    
    window.addEventListener('sessionsUpdated', handleSessionsUpdated);
    
    return () => {
      window.removeEventListener('sessionsUpdated', handleSessionsUpdated);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const result = await chrome.storage.local.get(['chatSessions']);
      const storedSessions = result.chatSessions || {};
      const sessionList = Object.values(storedSessions) as ChatSession[];
      setSessions(sessionList.sort((a, b) => b.lastUpdated - a.lastUpdated));
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const generateTitle = (session: ChatSession): string => {
    if (session.title) return session.title;
    
    const firstUserMessage = session.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    
    return `Chat ${new Date(session.createdAt).toLocaleDateString()}`;
  };

  const handleRename = (sessionId: string, currentTitle: string) => {
    setEditingId(sessionId);
    setEditTitle(currentTitle);
  };

  const saveRename = () => {
    if (editingId && editTitle.trim()) {
      onSessionRename(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground">Conversations</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => {
          const title = generateTitle(session);
          const isActive = session.id === currentSessionId;
          
          return (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b ${
                isActive ? 'bg-muted border-l-2 border-l-primary' : ''
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="h-6 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-sm truncate" title={title}>
                    {title}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {session.messages.length} messages
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRename(session.id, title)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSessionDelete(session.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        
        {sessions.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;