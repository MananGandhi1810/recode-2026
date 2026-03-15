"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSession, authClient, signOut } from "@/lib/auth-client";
import { Loader2, X, Hash, Save, Shield, User, Key, Bell, Zap, LogOut, CheckCircle, Search, Settings, MoreHorizontal, Plus, Users, ShieldAlert, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import ServerSidebar from "@/components/chat/ServerSidebar";
import ChannelSidebar from "@/components/chat/ChannelSidebar";
import ChatArea from "@/components/chat/ChatArea";
import MemberSidebar from "@/components/chat/MemberSidebar";

const SettingTab = ({ icon: Icon, label, active, onClick, danger }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all text-left",
      active 
        ? "bg-indigo-600/10 text-indigo-400 shadow-sm" 
        : danger 
          ? "text-rose-500 hover:bg-rose-500/10" 
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
    )}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId");
  const { data: session, isPending } = useSession();
  
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [channels, setChannels] = useState([]);
  const [dms, setDms] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [userPermissions, setUserPermissions] = useState([]);
  const [replyingTo, setReplyTo] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [orgSettingsTab, setOrgSettingsTab] = useState("members");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("identity");
  const [editName, setEditName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const activeChannelRef = useRef(null);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const refreshData = useCallback(async () => {
    if (!orgId) return;
    try {
      const [chRes, dmRes, memRes, roleRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/channels`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/dms`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/roles`, { credentials: "include" }).then(r => r.json())
      ]);

      if (chRes.success) setChannels(chRes.data);
      if (dmRes.success) setDms(dmRes.data);
      if (roleRes.success) setAvailableRoles(roleRes.data);
      if (memRes.success) {
        setMembers(memRes.data);
        const me = memRes.data.find(m => m.userId === session?.user?.id);
        if (me) setUserPermissions(me.permissions || []);
      }
      
      // Auto-select first channel if none active
      if (chRes.success && chRes.data.length > 0 && !activeChannelRef.current) {
        handleSelectChannel(chRes.data[0]);
      }
    } catch (e) { console.error("Refresh failed", e); }
  }, [orgId, session?.user?.id]);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) { router.push("/"); return; }
    
    const init = async () => {
      try {
        const orgs = await authClient.organization.list();
        if (orgs?.data) {
          setOrganizations(orgs.data);
          if (!orgId && orgs.data.length > 0) {
            router.push(`/chat?orgId=${orgs.data[0].id}`);
            return;
          }
        }
        if (orgId) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/init`, { method: "POST", credentials: "include" });
          refreshData();
        }
      } catch (e) { console.error(e); }
    };
    init();
  }, [orgId, session, isPending, router, refreshData]);

  useEffect(() => {
    if (!orgId || !session?.user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", {
      withCredentials: true, transports: ['websocket', 'polling']
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      if (activeChannelRef.current) newSocket.emit("join_room", { roomId: activeChannelRef.current.id });
    });

    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("new_message", (msg) => {
      if (msg.channelId === activeChannelRef.current?.id) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    });

    newSocket.on("message_deleted", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    newSocket.on("reaction_added", ({ reaction, messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), reaction] } : m));
    });

    newSocket.on("reaction_removed", ({ reactionId, messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== reactionId) } : m));
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [orgId, session?.user?.id]);

  const handleSelectChannel = useCallback((channel) => {
    if (activeChannelRef.current && socket) socket.emit("leave_room", { roomId: activeChannelRef.current.id });
    setActiveChannel(channel);
    setMessages([]);
    if (socket) socket.emit("join_room", { roomId: channel.id });
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/channels/${channel.id}/messages`, { credentials: "include" })
      .then(r => r.json())
      .then(json => { if (json.success) setMessages(json.data); });
  }, [orgId, socket]);

  const handleSendMessage = (e, attachment) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !attachment) || !socket || !activeChannel) return;
    
    socket.emit("send_message", {
      content: inputMessage, 
      channelId: activeChannel.id, 
      organizationId: orgId,
      parentMessageId: replyingTo?.id,
      ...(attachment && {
        attachmentUrl: attachment.url, attachmentType: attachment.type, attachmentName: attachment.name, attachmentSize: attachment.size
      })
    });
    setInputMessage("");
    setReplyTo(null);
  };

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/user/profile`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: editName, jobTitle: editJobTitle })
      });
      if ((await res.json()).success) {
        await authClient.updateUser({ name: editName });
        setIsSettingsOpen(false);
        refreshData();
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingProfile(false); }
  };

  const hasPermission = useCallback((p) => userPermissions.includes(p) || userPermissions.includes("MANAGE_SERVER"), [userPermissions]);

  if (isPending || !session?.user) return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Connecting to Nexus</p>
    </div>
  );

  const activeOrg = organizations.find(o => o.id === orgId);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <ServerSidebar 
        organizations={organizations} activeOrgId={orgId}
        onOrgSelect={(id) => router.push(id ? `/chat?orgId=${id}` : '/')}
        onSettingsClick={() => { setEditName(session.user.name); setEditJobTitle(session.user.jobTitle || ""); setIsSettingsOpen(true); }}
        userImage={session.user.image} userName={session.user.name}
      />
      
      {orgId && (
        <>
          <ChannelSidebar 
            orgName={activeOrg?.name || "Nexus"} channels={channels} dms={dms} activeChannelId={activeChannel?.id}
            onChannelSelect={handleSelectChannel} onCreateChannelClick={() => setIsModalOpen(true)}
            onOrgSettingsClick={() => setIsOrgSettingsOpen(true)} user={session.user}
            hasAdminPrivileges={hasPermission("MANAGE_SERVER") || hasPermission("MANAGE_ROLES")}
          />
          
          <ChatArea 
            activeChannel={activeChannel} messages={messages} user={session.user} onSendMessage={handleSendMessage}
            inputMessage={inputMessage} setInputMessage={setInputMessage} isConnected={isConnected}
            onDeleteMessage={(id) => socket?.emit("delete_message", { messageId: id, organizationId: orgId })}
            onAddReaction={(mid, e) => socket?.emit("add_reaction", { messageId: mid, emoji: e, organizationId: orgId })}
            onRemoveReaction={(mid, e) => socket?.emit("remove_reaction", { messageId: mid, emoji: e, organizationId: orgId })}
            hasPermission={hasPermission} onOpenSettings={() => setIsSettingsOpen(true)}
            onReply={setReplyTo} replyingTo={replyingTo} onCancelReply={() => setReplyTo(null)}
          />
          
          <MemberSidebar members={members} onMemberClick={(m) => { if (hasPermission("MANAGE_ROLES")) { setSelectedMember(m); setIsRoleModalOpen(true); } }} />
        </>
      )}

      {/* Role Management Modal */}
      {isRoleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800">
            <div className="flex items-center gap-4 mb-8">
               <img src={selectedMember.user.image || `https://ui-avatars.com/api/?name=${selectedMember.user.name}`} className="w-14 h-14 rounded-2xl object-cover" alt=""/>
               <div>
                  <h2 className="text-2xl font-bold text-zinc-100">{selectedMember.user.name}</h2>
                  <p className="text-zinc-500 font-medium">Manage Permissions</p>
               </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {availableRoles.map(role => {
                const isAssigned = selectedMember.memberRoles.some(mr => mr.roleId === role.id);
                return (
                  <button key={role.id} onClick={async () => {
                      const currentIds = selectedMember.memberRoles.map(mr => mr.roleId);
                      const newIds = isAssigned ? currentIds.filter(id => id !== role.id) : [...currentIds, role.id];
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members/${selectedMember.id}/roles`, {
                        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ roleIds: newIds })
                      });
                      refreshData();
                    }}
                    className={cn("w-full flex items-center justify-between p-4 rounded-2xl border transition-all", isAssigned ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#6366f1' }} />
                      <span className="font-bold text-sm uppercase">{role.name}</span>
                    </div>
                    {isAssigned && <CheckCircle className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)} className="w-full h-12 rounded-xl font-bold">Done</Button>
          </div>
        </div>
      )}

      {/* Org Settings / Admin Modal */}
      {isOrgSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[700px] bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 flex overflow-hidden">
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 p-8 flex flex-col gap-1">
               <div className="flex items-center gap-3 px-2 mb-10 font-bold italic text-indigo-500 tracking-tighter">NEXUS ADMIN</div>
               <SettingTab icon={Users} label="Members" active={orgSettingsTab === "members"} onClick={() => setOrgSettingsTab("members")} />
               <SettingTab icon={ShieldAlert} label="Roles" active={orgSettingsTab === "roles"} onClick={() => setOrgSettingsTab("roles")} />
               <div className="mt-auto pt-4"><SettingTab icon={X} label="Close Settings" onClick={() => setIsOrgSettingsOpen(false)} /></div>
            </aside>
            <main className="flex-1 flex flex-col bg-zinc-900 relative p-12 overflow-y-auto custom-scrollbar">
               <button onClick={() => setIsOrgSettingsOpen(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-zinc-800 text-zinc-400"><X className="w-6 h-6"/></button>
               {orgSettingsTab === "members" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold text-zinc-100 mb-2">Workspace Members</h2>
                    <p className="text-zinc-400 mb-10 font-medium">Managing access for {activeOrg?.name}.</p>
                    <div className="space-y-3">
                       {members.map(m => (
                         <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center gap-4">
                               <img src={m.user.image || `https://ui-avatars.com/api/?name=${m.user.name}`} className="w-12 h-12 rounded-xl" alt=""/>
                               <div>
                                  <div className="font-bold text-zinc-100 text-lg leading-tight">{m.user.name}</div>
                                  <div className="text-zinc-500 text-sm">{m.user.email}</div>
                               </div>
                            </div>
                            <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={() => { setSelectedMember(m); setIsRoleModalOpen(true); }}>Manage</Button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </main>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[600px] bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-800 flex overflow-hidden">
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 p-8 flex flex-col gap-1">
               <div className="flex items-center gap-3 px-2 mb-10 font-bold italic text-indigo-500 tracking-tighter">NEXUS SETTINGS</div>
               <SettingTab icon={User} label="Profile" active={activeSettingsTab === "identity"} onClick={() => setActiveSettingsTab("identity")} />
               <SettingTab icon={Shield} label="Security" active={activeSettingsTab === "security"} onClick={() => setActiveSettingsTab("security")} />
               <div className="mt-auto pt-4"><SettingTab icon={LogOut} label="Log Out" danger onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })} /></div>
            </aside>
            <main className="flex-1 flex flex-col bg-zinc-900 relative p-12">
               <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-all"><X className="w-6 h-6"/></button>
               {activeSettingsTab === "identity" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold text-zinc-100 mb-2">My Profile</h2>
                    <p className="text-zinc-400 mb-12 font-medium">Update your Nexus identity.</p>
                    <div className="space-y-10">
                       <div className="flex items-center gap-8 p-6 rounded-3xl bg-zinc-950 border border-zinc-800 w-fit">
                          <img src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}`} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-zinc-900 shadow-2xl" alt=""/>
                          <div className="flex flex-col gap-3">
                             <span className="text-[11px] font-bold uppercase text-zinc-500">Global Role</span>
                             <div className="px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[11px] uppercase tracking-widest">{activeOrg?.role?.toUpperCase() || "MEMBER"}</div>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[11px] font-bold uppercase text-zinc-500 ml-1">Display Name</label>
                           <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl px-6 font-bold text-lg"/>
                         </div>
                         <div className="space-y-3">
                           <label className="text-[11px] font-bold uppercase text-zinc-500 ml-1">Status / Role</label>
                           <Input value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl px-6 font-medium"/>
                         </div>
                       </div>
                       <Button onClick={handleUpdateProfile} disabled={isSavingProfile} className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                         {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-5 h-5 mr-3"/> Save Changes</>}
                       </Button>
                    </div>
                 </div>
               )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
