"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Plus, Users, LayoutDashboard, LogOut, Send, MoreVertical, MessageSquare } from "lucide-react";

const formatMessageTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId");
  const { data: session, isPending } = useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const [socket, setSocket] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const activeChannelRef = useRef(null);
  
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

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
        // Use the ref to get the most up-to-date activeChannel
        const currentChannel = activeChannelRef.current;
        if (currentChannel && messageData.channelId === currentChannel.id) {
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

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const result = await authClient.organization.inviteMember({
        organizationId: orgId,
        email: inviteEmail,
        role: inviteRole
      });
      if (result.error) throw result.error;
      alert("Invitation sent!");
      setIsInviteModalOpen(false);
      setInviteEmail("");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to invite member");
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
      <aside className="w-64 bg-[#3F0E40] text-zinc-300 flex flex-col flex-shrink-0">
        <div className="h-14 border-b border-[#522653] flex items-center px-4 justify-between font-bold text-white shadow-sm hover:bg-[#350d36] transition cursor-pointer">
          <div className="flex items-center gap-2 truncate">
             <span className="truncate">{activeOrg?.name || "Organization"}</span>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)} 
            className="p-1 hover:bg-[#522653] rounded transition disabled:opacity-50 disabled:cursor-not-allowed" 
            title="Invite User"
            disabled={activeOrg?.activeMember?.role === "member"}
          >
            <Users className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#b8a5b8]">
            <span>Channels</span>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="hover:bg-[#522653] p-1 rounded-md transition text-[#b8a5b8] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeOrg?.activeMember?.role === "member"}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-[2px] px-2 mb-6">
            {channels.map(channel => (
              <button 
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel?.id === channel.id 
                    ? 'bg-[#1164A3] text-white font-medium' 
                    : 'text-[#b8a5b8] hover:bg-[#350d36]'
                }`}
              >
                <Hash className="w-4 h-4 opacity-70" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            {channels.length === 0 && (
              <div className="px-3 text-sm text-[#b8a5b8] opacity-70">No channels yet</div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#522653] bg-[#350d36] flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm relative">
            {session.user.name?.[0] || session.user.email[0].toUpperCase()}
            {isConnected && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#350d36] rounded-full"></span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{session.user.name || session.user.email.split('@')[0]}</p>
            <p className="text-xs text-[#b8a5b8] truncate capitalize">{activeOrg?.activeMember?.role || 'Member'}</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative">
        {activeChannel ? (
          <>
            <header className="h-14 border-b flex flex-col justify-center px-6 shrink-0 bg-white/95 dark:bg-zinc-950/95 z-10 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Hash className="w-5 h-5 text-muted-foreground stroke-[2.5]" />
                {activeChannel.name}
              </div>
              {activeChannel.description && (
                <div className="text-sm text-muted-foreground truncate">{activeChannel.description}</div>
              )}
            </header>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto pt-6 pb-2"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col mt-auto justify-end px-6 pb-4 opacity-80 pointer-events-none">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                    <Hash className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="text-3xl mb-2 font-bold tracking-tight">Welcome to #{activeChannel.name}!</div>
                  <p className="text-base text-muted-foreground">This is the start of the #{activeChannel.name} channel. {activeChannel.description}</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const isSequential = prevMsg && 
                                         prevMsg.authorId === msg.authorId && 
                                         (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000);

                    return (
                      <div key={msg.id || msg.createdAt} className={`flex px-6 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${isSequential ? 'py-0.5' : 'pt-4 pb-1 mt-1'}`}>
                        <div className="min-w-[40px] w-10 mr-3 flex justify-center shrink-0">
                          {isSequential ? (
                             <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 select-none pt-1">
                               {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-[#1164A3] text-white flex items-center justify-center font-bold shadow-sm">
                              {msg.author?.user?.name?.[0]?.toUpperCase() || msg.author?.user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {!isSequential && (
                            <div className="flex items-baseline gap-2 mb-0.5 leading-tight">
                              <span className="font-bold text-[15px]">{msg.author?.user?.name || msg.author?.user?.email?.split('@')[0] || 'User'}</span>
                              <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className="text-[15px] text-zinc-900 dark:text-zinc-100 leading-normal max-w-none whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 pb-6 pt-2 shrink-0 bg-white dark:bg-zinc-950">
              <form onSubmit={handleSendMessage} className="relative">
                <div className="border border-zinc-400 dark:border-zinc-700 focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-700/30 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all flex flex-col">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (inputMessage.trim() && isConnected) {
                           handleSendMessage(e);
                        }
                      }
                    }}
                    placeholder={`Message #${activeChannel.name}`}
                    className="w-full max-h-[300px] min-h-[44px] px-3 py-3 resize-none outline-none bg-transparent text-[15px] leading-relaxed"
                    rows={1}
                  />
                  <div className="bg-zinc-50 dark:bg-zinc-950/50 px-2 py-2 flex justify-between items-center gap-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex gap-1 text-muted-foreground">
                      <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded shrink-0"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <Button 
                      size="icon"
                      type="submit" 
                      disabled={!isConnected || !inputMessage.trim()}
                      className={`w-8 h-8 rounded shrink-0 ${inputMessage.trim() ? 'bg=[#007a5a] text-white hover:bg-[#148567]' : 'bg-transparent text-muted-foreground hover:bg-transparent'}`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>
              <div className="text-center mt-2 text-[11px] text-muted-foreground">
                <span className="font-semibold">Return</span> to send, <span className="font-semibold">Shift + Return</span> to add a new line
              </div>
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

      {/* Invite Member Modal Inline */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-xl shadow-2xl p-6 border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Invite people</h2>
            <p className="text-sm text-muted-foreground mb-6">Invite new members to join your organization.</p>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email address</label>
                <Input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                <Button type="submit">Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}