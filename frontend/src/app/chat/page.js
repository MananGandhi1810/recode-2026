"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Plus, Users, LayoutDashboard, LogOut, Send } from "lucide-react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId");
  const { data: session, isPending } = useSession();

  const [socket, setSocket] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  const scrollRef = useRef(null);

  // 1. Initialize logic
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/");
      return;
    }
    if (!orgId) {
      router.push("/");
      return;
    }

    loadChannels();

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", {
      withCredentials: true, 
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("new_message", (messageData) => {
      setMessages((prev) => {
        // If the message brings to current active channel, append
        if (activeChannel && messageData.channelId === activeChannel.id) {
          return [...prev, messageData];
        }
        return prev;
      });
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [orgId, session, isPending, router]);

  // 2. Fetch Channels
  const loadChannels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orgs/${orgId}/channels`, {
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        setChannels(json.data);
        if (json.data.length > 0 && !activeChannel) {
          handleSelectChannel(json.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Switch Channel
  const handleSelectChannel = async (channel) => {
    if (activeChannel && socket) {
      socket.emit("leave_room", { roomId: activeChannel.id });
    }
    
    setActiveChannel(channel);
    setMessages([]); // Clear until load
    
    if (socket) {
      socket.emit("join_room", { roomId: channel.id });
    }
    
    // Load messages
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orgs/${orgId}/channels/${channel.id}/messages`, {
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        setMessages(json.data); // data is already reversed by backend
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orgs/${orgId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newChannelName.toLowerCase().replace(/\s+/g, '-'), description: newChannelDesc })
      });
      const json = await res.json();
      if (json.success) {
        setChannels([...channels, json.data]);
        setIsModalOpen(false);
        setNewChannelName("");
        setNewChannelDesc("");
        handleSelectChannel(json.data);
      } else {
        alert(json.message || "Failed to create channel");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeChannel) return;

    const messageData = {
      content: inputMessage,
      channelId: activeChannel.id,
      organizationId: orgId
    };

    socket.emit("send_message", messageData);
    setInputMessage("");
  };

  if (isPending || !session) {
    return <div className="h-screen w-full flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* Sidebar Area */}
      <aside className="w-64 bg-zinc-100 dark:bg-zinc-900 border-r flex flex-col flex-shrink-0">
        <div className="h-14 border-b flex items-center px-4 justify-between bg-zinc-200 dark:bg-zinc-950 font-semibold shadow-sm">
          <span>Organization</span>
          {isConnected && <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Channels</span>
            <button onClick={() => setIsModalOpen(true)} className="hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1 rounded-md transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-[2px] px-2">
            {channels.map(channel => (
              <button 
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel?.id === channel.id 
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-foreground font-medium' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Hash className="w-4 h-4 opacity-70" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            {channels.length === 0 && (
              <div className="px-3 text-sm text-muted-foreground opacity-70">No channels yet</div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-zinc-100 dark:bg-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {session.user.name?.[0] || session.user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{session.user.name || session.user.email.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black relative">
        {activeChannel ? (
          <>
            <header className="h-14 border-b flex flex-col justify-center px-6 shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 shadow-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Hash className="w-5 h-5 text-muted-foreground" />
                {activeChannel.name}
              </div>
              {activeChannel.description && (
                <div className="text-xs text-muted-foreground truncate">{activeChannel.description}</div>
              )}
            </header>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col max-w-sm m-auto justify-center opacity-70 pointer-events-none">
                  <div className="text-4xl mb-4 font-bold tracking-tighter">Welcome to #{activeChannel.name}!</div>
                  <p className="text-lg">This is the start of the #{activeChannel.name} channel.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isIncoming = msg.author?.user?.id !== session.user.id;
                  return (
                    <div key={msg.id || msg.createdAt} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold shrink-0">
                        {msg.author?.user?.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold">{msg.author?.user?.name || 'User'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-prose whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 pb-6 pt-2 shrink-0">
              <form onSubmit={handleSendMessage} className="relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  className="w-full pr-12 pl-4 py-6 bg-zinc-50 border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl outline-none focus-visible:ring-1 shadow-sm"
                />
                <Button 
                  size="icon"
                  type="submit" 
                  disabled={!isConnected || !inputMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <LayoutDashboard className="w-16 h-16 mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold">No Channel Selected</h2>
            <p className="mt-2">Select a channel from the sidebar or create a new one.</p>
          </div>
        )}
      </main>

      {/* Creating Channel Modal Inline */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-xl shadow-2xl p-6 border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Create a channel</h2>
            <p className="text-sm text-muted-foreground mb-6">Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.</p>
            
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Name</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. plan-budget"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Description (optional)</label>
                <Input 
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}