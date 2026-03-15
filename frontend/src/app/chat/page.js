"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSession, authClient, signOut } from "@/lib/auth-client";
import { Loader2, X, Hash, Save, Shield, User, Key, Bell, Zap, LogOut, CheckCircle, Search, Settings, MoreHorizontal, Plus, Users, ShieldAlert, Palette, Lock, Edit2, AlertTriangle, Trash2, Mail, Copy, RefreshCw, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";

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
        ? "bg-[#bd93f9]/10 text-[#bd93f9] shadow-sm" 
        : danger 
          ? "text-[#ff5555] hover:bg-[#ff5555]/10" 
          : "text-[#6272a4] hover:bg-[#44475a]/30 hover:text-[#f8f8f2]"
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
  const [currentUserMemberId, setCurrentUserMemberId] = useState(null);
  const [replyingTo, setReplyTo] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadState, setUnreadState] = useState({}); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [orgSettingsTab, setOrgSettingsTab] = useState("general");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  
  const [workspaceEmojis, setWorkspaceEmojis] = useState([]);
  const [newEmojiName, setNewEmojiName] = useState("");

  // Channel Creation/Editing
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("identity");
  const [editName, setEditName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Org Edit Settings
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgLogo, setEditOrgLogo] = useState("");
  const [editOrgIsPublic, setEditOrgIsPublic] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const activeChannelRef = useRef(null);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const refreshData = useCallback(async () => {
    if (!orgId || orgId === 'null') {
      try {
        const dmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/user/dms`, { credentials: "include" }).then(r => r.json());
        if (dmRes.success) setDms(dmRes.data);
        setChannels([]); setMembers([]); setUserPermissions([]); setCurrentUserMemberId(null);
      } catch (e) { console.error(e); }
      return;
    }

    try {
      const [chRes, dmRes, memRes, roleRes, emojiRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/channels`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/dms`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/roles`, { credentials: "include" }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/emojis`, { credentials: "include" }).then(r => r.json())
      ]);

      if (chRes.success) {
        setChannels(chRes.data);
        if (activeChannelRef.current) {
          const updated = chRes.data.find(c => c.id === activeChannelRef.current.id);
          if (updated) setActiveChannel(updated);
        }
      }
      if (dmRes.success) setDms(dmRes.data);
      if (roleRes.success) setAvailableRoles(roleRes.data);
      if (emojiRes.success) setWorkspaceEmojis(emojiRes.data);
      if (memRes.success) {
        setMembers(memRes.data);
        const me = memRes.data.find(m => m.userId === session?.user?.id);
        if (me) {
          setUserPermissions(me.permissions || []);
          setCurrentUserMemberId(me.id);
        }
      }
      
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
          if (orgId === undefined && orgs.data.length > 0) {
             router.push(`/chat?orgId=${orgs.data[0].id}`);
             return;
          }
        }
        if (orgId && orgId !== 'null') {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/init`, { method: "POST", credentials: "include" });
        }
        refreshData();
      } catch (e) { console.error(e); }
    };
    init();
  }, [orgId, session, isPending, router, refreshData]);

  useEffect(() => {
    if (!session?.user) return;
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", {
      withCredentials: true, transports: ['websocket', 'polling'], reconnectionAttempts: 5, reconnectionDelay: 1000,
    });
    newSocket.on("connect", () => {
      setIsConnected(true);
      if (activeChannelRef.current) newSocket.emit("join_room", { roomId: activeChannelRef.current.id });
    });
    newSocket.on("disconnect", () => setIsConnected(false));
    newSocket.on("new_message", (msg) => {
      const isActive = msg.channelId === activeChannelRef.current?.id;
      if (isActive) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else {
        setUnreadState(prev => {
          const isMention = msg.content.includes("@everyone") || (session?.user?.name && msg.content.includes(`@${session.user.name.replace(/\s+/g, '')}`));
          if (isMention) return { ...prev, [msg.channelId]: 'mention' };
          if (!prev[msg.channelId]) return { ...prev, [msg.channelId]: 'unread' };
          return prev;
        });
      }
    });
    newSocket.on("message_deleted", ({ messageId }) => setMessages(prev => prev.filter(m => m.id !== messageId)));
    newSocket.on("reaction_added", ({ reaction, messageId }) => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []).filter(r => r.id !== reaction.id), reaction] } : m)));
    newSocket.on("reaction_removed", ({ reactionId, messageId }) => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== reactionId) } : m)));
    newSocket.on("user_status_changed", ({ userId, status }) => setMembers(prev => prev.map(m => m.userId === userId ? { ...m, user: { ...m.user, status } } : m)));
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [session?.user?.id]);

  useEffect(() => {
    if (socket && isConnected && activeChannel) socket.emit("join_room", { roomId: activeChannel.id });
  }, [socket, isConnected, activeChannel?.id]);

  const handleSelectChannel = useCallback((channel) => {
    if (activeChannelRef.current && socket) socket.emit("leave_room", { roomId: activeChannelRef.current.id });
    setActiveChannel(channel);
    setMessages([]);
    setUnreadState(prev => { const newState = { ...prev }; delete newState[channel.id]; return newState; });
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${channel.organizationId}/channels/${channel.id}/messages`, { credentials: "include" })
      .then(r => r.json()).then(json => { if (json.success) setMessages(prev => { const existingIds = new Set(prev.map(m => m.id)); const newMessages = json.data.filter(m => !existingIds.has(m.id)); return [...prev, ...newMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); }); });
  }, [socket]);

  const handleSendMessage = (e, attachment) => {
    if (e) e.preventDefault();
    const finalAttachment = attachment || pendingAttachment;
    if ((!inputMessage.trim() && !finalAttachment) || !socket || !activeChannel) return;
    socket.emit("send_message", { content: inputMessage, channelId: activeChannel.id, organizationId: activeChannel.organizationId, parentMessageId: replyingTo?.id, ...(finalAttachment && { attachmentUrl: finalAttachment.url, attachmentType: finalAttachment.type, attachmentName: finalAttachment.name, attachmentSize: finalAttachment.size }) });
    setInputMessage(""); setReplyTo(null); setPendingAttachment(null);
  };

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/user/profile`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: editName, jobTitle: editJobTitle, image: editImage })
      });
      if ((await res.json()).success) { await authClient.updateUser({ name: editName, image: editImage }); setIsSettingsOpen(false); refreshData(); }
    } catch (e) { console.error(e); } finally { setIsSavingProfile(false); }
  };

  const handleUpdateOrg = async () => {
    setIsSavingOrg(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: editOrgName, logo: editOrgLogo, isPublic: editOrgIsPublic })
      });
      if ((await res.json()).success) refreshData();
    } catch (e) { console.error(e); } finally { setIsSavingOrg(false); }
  };

  const handleCreateChannel = async (e) => {
    if (e) e.preventDefault();
    if (!newChannelName.trim() || !orgId) return;
    try {
      const url = isEditingChannel ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/channels/${activeChannel.id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/channels`;
      const res = await fetch(url, {
        method: isEditingChannel ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: newChannelName, description: newChannelDesc, type: "TEXT", isPrivate: isPrivateChannel })
      });
      if ((await res.json()).success) { setIsModalOpen(false); setNewChannelName(""); setNewChannelDesc(""); setIsPrivateChannel(false); setIsEditingChannel(false); refreshData(); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/roles/${roleId}`, { method: "DELETE", credentials: "include" });
      if ((await res.json()).success) refreshData();
    } catch (e) { console.error(e); }
  };

  const hasPermission = useCallback((p) => {
    if (!orgId || orgId === 'null') return true;
    return userPermissions.includes(p) || userPermissions.includes("MANAGE_SERVER");
  }, [orgId, userPermissions]);

  if (isPending || !session?.user) return (
    <div className="h-screen w-full bg-[#282a36] flex flex-col items-center justify-center text-zinc-100">
      <Loader2 className="w-8 h-8 animate-spin text-[#bd93f9] mb-4" />
      <p className="text-sm font-bold uppercase tracking-widest text-[#6272a4]">Connecting to Nexus</p>
    </div>
  );

  const activeOrg = organizations.find(o => o.id === orgId);
  const me = members.find(m => m.userId === session?.user?.id);
  const displayUser = me ? { ...session.user, ...me.user } : session.user;

  return (
    <div className="flex h-screen w-full bg-[#282a36] text-[#f8f8f2] overflow-hidden font-sans selection:bg-[#44475a]">
      <ServerSidebar organizations={organizations} activeOrgId={orgId} onOrgSelect={(id) => id ? router.push(`/chat?orgId=${id}`) : router.push('/chat?orgId=null')} onCreateClick={() => router.push('/')} />
      
      {orgId === 'null' ? (
        <div className="flex-1 flex overflow-hidden">
           <ChannelSidebar orgName="Direct Messages" organizations={organizations} activeOrgId={null} onOrgSelect={(id) => router.push(`/chat?orgId=${id}`)} dms={dms} activeChannelId={activeChannel?.id} onChannelSelect={handleSelectChannel} user={displayUser} searchQuery={searchQuery} setSearchQuery={setSearchQuery} unreadState={unreadState} onUserSettingsClick={() => { setEditName(displayUser.name); setEditJobTitle(displayUser.jobTitle || ""); setEditImage(displayUser.image || ""); setIsSettingsOpen(true); }} onCreateChannelClick={() => router.push('/')} />
           <ChatArea activeChannel={activeChannel} messages={messages} user={displayUser} onSendMessage={handleSendMessage} inputMessage={inputMessage} setInputMessage={setInputMessage} isConnected={isConnected} onReply={setReplyTo} replyingTo={replyingTo} onCancelReply={() => setReplyTo(null)} currentUserMemberId={currentUserMemberId} pendingAttachment={pendingAttachment} setPendingAttachment={setPendingAttachment} hasPermission={hasPermission} />
        </div>
      ) : orgId && (
        <>
          <ChannelSidebar 
            orgName={activeOrg?.name || "Nexus"} organizations={organizations} activeOrgId={orgId} onOrgSelect={(id) => router.push(id ? `/chat?orgId=${id}` : '/chat?orgId=null')}
            channels={channels} dms={dms} activeChannelId={activeChannel?.id} onChannelSelect={handleSelectChannel} onCreateChannelClick={() => { setIsEditingChannel(false); setNewChannelName(""); setNewChannelDesc(""); setIsPrivateChannel(false); setIsModalOpen(true); }}
            onOrgSettingsClick={() => { setEditOrgName(activeOrg.name); setEditOrgLogo(activeOrg.logo || ""); setEditOrgIsPublic(activeOrg.isPublic); setIsOrgSettingsOpen(true); }} user={displayUser} hasAdminPrivileges={hasPermission("MANAGE_SERVER") || hasPermission("MANAGE_ROLES")}
            onUserSettingsClick={() => { setEditName(displayUser.name); setEditJobTitle(displayUser.jobTitle || ""); setEditImage(displayUser.image || ""); setIsSettingsOpen(true); }}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} unreadState={unreadState}
          />
          <ChatArea 
            activeChannel={activeChannel} messages={messages} user={displayUser} onSendMessage={handleSendMessage} inputMessage={inputMessage} setInputMessage={setInputMessage} isConnected={isConnected}
            onDeleteMessage={(id) => socket?.emit("delete_message", { messageId: id, organizationId: orgId })} onAddReaction={(mid, e) => socket?.emit("add_reaction", { messageId: mid, emoji: e, organizationId: orgId })}
            onRemoveReaction={(mid, e) => socket?.emit("remove_reaction", { messageId: mid, emoji: e, organizationId: orgId })} hasPermission={hasPermission} onOpenSettings={() => { setNewChannelName(activeChannel.name); setNewChannelDesc(activeChannel.description || ""); setIsPrivateChannel(activeChannel.isPrivate); setIsEditingChannel(true); setIsModalOpen(true); }}
            onReply={setReplyTo} replyingTo={replyingTo} onCancelReply={() => setReplyTo(null)} currentUserMemberId={currentUserMemberId} onTyping={(isTyping) => socket?.emit("typing", { roomId: activeChannel?.id, isTyping })}
            typingUsers={typingUsers} members={members} pendingAttachment={pendingAttachment} setPendingAttachment={setPendingAttachment}
          />
          <MemberSidebar members={members} onMemberClick={(m) => { if (hasPermission("MANAGE_ROLES")) { setSelectedMember(m); setIsRoleModalOpen(true); } }} />
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#282a36] rounded-2xl shadow-2xl p-8 border border-[#44475a]">
             <h2 className="text-2xl font-bold text-[#f8f8f2] mb-2">{isEditingChannel ? "Channel Settings" : "Create Channel"}</h2>
             <form onSubmit={handleCreateChannel} className="space-y-6">
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase text-[#6272a4] ml-1">Channel Name</label><Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. marketing" className="h-14 bg-[#44475a]/20 border-[#44475a] rounded-xl px-6 font-semibold text-[#f8f8f2]" /></div>
                <div className="space-y-2"><label className="text-[11px] font-bold uppercase text-[#6272a4] ml-1">Description</label><Input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} placeholder="What is this channel about?" className="h-14 bg-[#44475a]/20 border-[#44475a] rounded-xl px-6 font-medium text-[#f8f8f2]" /></div>
                <div className="flex items-center justify-between p-4 bg-[#44475a]/20 border border-[#44475a] rounded-xl"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#44475a] flex items-center justify-center text-[#ff79c6]"><Lock className="w-5 h-5" /></div><div className="flex flex-col"><span className="text-sm font-semibold text-[#f8f8f2]">Private Channel</span><span className="text-[10px] text-[#6272a4]">Only members can view this channel.</span></div></div><input type="checkbox" checked={isPrivateChannel} onChange={e => setIsPrivateChannel(e.target.checked)} className="w-5 h-5 accent-[#bd93f9]" /></div>
                <div className="flex gap-4 pt-4"><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-xl font-bold text-[#f8f8f2]">Cancel</Button><Button type="submit" disabled={!newChannelName.trim()} className="flex-1 h-14 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-xl">{isEditingChannel ? "Save Changes" : "Create"}</Button></div>
             </form>
          </div>
        </div>
      )}

      {isRoleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#282a36] rounded-2xl shadow-2xl p-8 border border-[#44475a]">
            <div className="flex items-center gap-4 mb-8"><img src={selectedMember.user.image || `https://ui-avatars.com/api/?name=${selectedMember.user.name}`} className="w-14 h-14 rounded-xl object-cover" alt=""/><h2 className="text-2xl font-bold text-[#f8f8f2]">{selectedMember.user.name}</h2></div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {availableRoles.map(role => {
                const isAssigned = selectedMember.memberRoles.some(mr => mr.roleId === role.id);
                const isSelf = selectedMember.userId === session?.user?.id;
                const activeOrgMember = members.find(m => m.userId === session?.user?.id);
                const isOwner = activeOrgMember?.role === 'owner';
                return (
                  <button key={role.id} disabled={isSelf && !isOwner} onClick={async () => {
                      const currentIds = selectedMember.memberRoles.map(mr => mr.roleId);
                      const newIds = isAssigned ? currentIds.filter(id => id !== role.id) : [...currentIds, role.id];
                      setSelectedMember(prev => ({ ...prev, memberRoles: isAssigned ? prev.memberRoles.filter(mr => mr.roleId !== role.id) : [...prev.memberRoles, { roleId: role.id, role }] }));
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members/${selectedMember.id}/roles`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ roleIds: newIds }) });
                      refreshData();
                    }} className={cn("w-full flex items-center justify-between p-4 rounded-xl border transition-all", isAssigned ? "bg-[#bd93f9]/10 border-[#bd93f9]/30 text-[#bd93f9]" : "bg-[#44475a]/20 border-[#44475a] text-[#6272a4] hover:border-[#6272a4]", (isSelf && !isOwner) && "opacity-50 cursor-not-allowed")}>
                    <div className="flex items-center gap-4"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#bd93f9' }} /><span className="font-semibold text-sm uppercase tracking-tight">{role.name}</span></div>
                    {isAssigned && <CheckCircle className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)} className="w-full h-12 rounded-xl font-bold text-[#f8f8f2]">Done</Button>
          </div>
        </div>
      )}

      {isOrgSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 text-[#f8f8f2]">
          <div className="w-full max-w-5xl h-[700px] bg-[#282a36] rounded-2xl shadow-2xl border border-[#44475a] flex overflow-hidden">
            <aside className="w-64 bg-[#1e1e22] border-r border-[#44475a]/50 p-8 flex flex-col gap-1">
               <div className="flex items-center gap-3 px-2 mb-10 font-bold italic text-[#bd93f9] tracking-tighter uppercase text-xs">Nexus Admin</div>
               <SettingTab icon={Settings} label="General" active={orgSettingsTab === "general"} onClick={() => setOrgSettingsTab("general")} />
               <SettingTab icon={Users} label="Members" active={orgSettingsTab === "members"} onClick={() => setOrgSettingsTab("members")} />
               <SettingTab icon={ShieldAlert} label="Roles" active={orgSettingsTab === "roles"} onClick={() => setOrgSettingsTab("roles")} />
               <SettingTab icon={Smile} label="Emojis" active={orgSettingsTab === "emojis"} onClick={() => setOrgSettingsTab("emojis")} />
               <div className="mt-auto pt-4"><SettingTab icon={X} label="Close Settings" onClick={() => setIsOrgSettingsOpen(false)} /></div>
            </aside>
            <main className="flex-1 flex flex-col bg-[#282a36] relative p-12 overflow-y-auto custom-scrollbar">
               <button onClick={() => setIsOrgSettingsOpen(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-[#44475a] text-[#6272a4] transition-all"><X className="w-6 h-6"/></button>
               
               {orgSettingsTab === "general" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold mb-2">Node Overview</h2>
                    <div className="space-y-10 mt-10">
                       <div className="flex items-center gap-8 p-6 rounded-2xl bg-[#44475a]/20 border border-[#44475a] w-fit relative group">
                          <img src={editOrgLogo || `https://ui-avatars.com/api/?name=${activeOrg?.name}`} className="w-24 h-24 rounded-xl object-cover ring-4 ring-[#282a36]" alt=""/>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"><UploadButton endpoint="imageUploader" className="ut-button:bg-transparent ut-button:h-full ut-button:w-full ut-allowed-content:hidden" content={{ button: <Palette className="w-8 h-8 text-white"/> }} onClientUploadComplete={(res) => { if (res?.[0]) setEditOrgLogo(res[0].url); }}/></div>
                          <div className="flex flex-col gap-2">
                             <span className="text-[11px] font-bold uppercase text-[#6272a4]">Access Code</span>
                             <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#282a36] border border-[#44475a] font-mono text-[#bd93f9] text-sm">
                                {activeOrg?.joinCode || "GENERATING..."}
                                <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-all" onClick={() => { navigator.clipboard.writeText(activeOrg?.joinCode); alert("Copied!"); }} />
                             </div>
                          </div>
                       </div>
                       <div className="space-y-6 max-w-md">
                          <div className="space-y-3"><label className="text-[11px] font-bold uppercase text-[#6272a4]">Node Name</label><Input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} className="h-14 bg-[#44475a]/20 border-[#44475a] rounded-xl px-6 text-[#f8f8f2] font-bold" /></div>
                          <div className="flex items-center justify-between p-4 bg-[#44475a]/20 border border-[#44475a] rounded-xl"><div className="flex flex-col"><span className="text-sm font-semibold">Public Node</span><span className="text-[10px] text-[#6272a4]">Visible in terminal discovery.</span></div><input type="checkbox" checked={editOrgIsPublic} onChange={e => setEditOrgIsPublic(e.target.checked)} className="w-5 h-5 accent-[#bd93f9]" /></div>
                          <Button onClick={handleUpdateOrg} disabled={isSavingOrg} className="h-14 px-10 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl w-full">{isSavingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}</Button>
                       </div>
                    </div>
                 </div>
               )}

               {orgSettingsTab === "members" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold">Workspace Members</h2>
                    <div className="space-y-3 mt-10">
                       {members.map(m => (
                         <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-[#44475a]/20 border border-[#44475a]">
                            <div className="flex items-center gap-4"><img src={m.user.image || `https://ui-avatars.com/api/?name=${m.user.name}`} className="w-12 h-12 rounded-xl" alt=""/><div className="font-bold text-lg leading-tight">{m.user.name}</div></div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="rounded-xl font-bold border-[#44475a] text-[#6272a4] hover:text-[#f8f8f2]" onClick={() => { setSelectedMember(m); setIsRoleModalOpen(true); }}>Manage</Button>
                              <Button size="sm" variant="destructive" className="rounded-xl font-bold border-[#ff5555] text-[#ff5555] hover:text-white" onClick={async () => {
                                if (window.confirm(`Kick ${m.user.name}?`)) {
                                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members/${m.id}/kick`, { method: "POST", credentials: "include" });
                                  refreshData();
                                }
                              }}>Kick</Button>
                              <Button size="sm" variant="destructive" className="rounded-xl font-bold border-[#ff5555] text-[#ff5555] hover:text-white" onClick={async () => {
                                if (window.confirm(`Ban ${m.user.name}?`)) {
                                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/members/${m.id}/ban`, { method: "POST", credentials: "include" });
                                  refreshData();
                                }
                              }}>Ban</Button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {orgSettingsTab === "emojis" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold">Custom Emojis</h2>
                    <p className="text-[#6272a4] mt-2">Add unique icons to your workspace messages.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-10">
                       <div className="aspect-square rounded-2xl bg-[#44475a]/20 border border-dashed border-[#44475a] flex flex-col items-center justify-center p-4 relative group">
                          <PlusCircle className="w-8 h-8 text-[#6272a4] group-hover:text-[#bd93f9] transition-all" />
                          <UploadButton endpoint="workspaceEmoji" className="absolute inset-0 opacity-0 ut-button:w-full ut-button:h-full" onClientUploadComplete={async (res) => {
                             if (res?.[0]) {
                               const name = prompt("Enter emoji name (alphanumeric only):");
                               if (name) {
                                 await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/emojis`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, url: res[0].url }) });
                                 refreshData();
                               }
                             }
                          }} />
                       </div>
                       {workspaceEmojis.map(emoji => (
                         <div key={emoji.id} className="aspect-square rounded-2xl bg-[#44475a]/20 border border-[#44475a] flex flex-col items-center justify-center p-4 relative group">
                            <img src={emoji.url} className="w-12 h-12 object-contain" alt=""/>
                            <span className="text-[10px] font-bold mt-2 truncate max-w-full">:{emoji.name}:</span>
                            <button onClick={async () => { if(confirm("Delete emoji?")) { await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/emojis/${emoji.id}`, { method: "DELETE", credentials: "include" }); refreshData(); } }} className="absolute -top-2 -right-2 p-1 bg-[#ff5555] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-white"/></button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {orgSettingsTab === "roles" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-bold">Role Management</h2>
                      <Button onClick={async () => {
                        const name = prompt("Enter role name:");
                        if (name) { await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, permissions: ["VIEW_CHANNELS", "SEND_MESSAGES"], color: "#bd93f9", position: availableRoles.length + 1 }) }); refreshData(); }
                      }} className="h-12 rounded-xl bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold px-6 shadow-lg">Create Role</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {availableRoles.map(role => (
                         <div key={role.id} className="p-6 rounded-2xl bg-[#44475a]/20 border border-[#44475a] flex flex-col gap-6">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: role.color || "#bd93f9" }} /><span className="font-bold text-lg tracking-tight">{role.name}</span></div>{!role.isBaseRole && (<button onClick={() => handleDeleteRole(role.id)} className="p-2 hover:bg-[#ff5555]/10 rounded-lg text-[#ff5555] transition-all"><Trash2 className="w-4 h-4" /></button>)}</div>
                            <div className="flex flex-wrap gap-2">{["VIEW_CHANNELS", "SEND_MESSAGES", "CREATE_CHANNELS", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "MANAGE_ROLES", "BAN_MEMBERS", "ADD_REACTIONS", "MANAGE_SERVER"].map(perm => { const hasPerm = role.permissions.includes(perm); return (<button key={perm} onClick={async () => { const newPerms = hasPerm ? role.permissions.filter(p => p !== perm) : [...role.permissions, perm]; await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/${orgId}/roles/${role.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: role.name, permissions: newPerms, color: role.color, position: role.position }) }); refreshData(); }} className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all uppercase tracking-widest", hasPerm ? "bg-[#bd93f9]/10 border-[#bd93f9]/30 text-[#bd93f9]" : "bg-[#282a36] border-[#44475a] text-[#6272a4] hover:border-[#6272a4]")}>{perm.replace('_', ' ')}</button>); })}</div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </main>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[600px] bg-[#282a36] rounded-2xl shadow-2xl border border-[#44475a] flex overflow-hidden text-[#f8f8f2]">
            <aside className="w-64 bg-[#1e1e22] border-r border-[#44475a]/50 p-8 flex flex-col gap-1">
               <div className="flex items-center gap-3 px-2 mb-10 font-bold italic text-[#bd93f9] tracking-tighter uppercase text-xs">Nexus Settings</div>
               <SettingTab icon={User} label="Profile" active={activeSettingsTab === "identity"} onClick={() => setActiveSettingsTab("identity")} />
               <SettingTab icon={Shield} label="Security" active={activeSettingsTab === "security"} onClick={() => setActiveSettingsTab("security")} />
               <div className="mt-auto pt-4"><SettingTab icon={LogOut} label="Log Out" danger onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })} /></div>
            </aside>
            <main className="flex-1 flex flex-col bg-[#282a36] relative p-12 overflow-y-auto custom-scrollbar font-sans">
               <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-[#44475a] text-[#6272a4] transition-all"><X className="w-6 h-6"/></button>
               {activeSettingsTab === "identity" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold">My Profile</h2>
                    <div className="space-y-10 mt-10">
                       <div className="flex items-center gap-8 p-6 rounded-2xl bg-[#44475a]/20 border border-[#44475a] w-fit relative group"><img src={editImage || session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}`} className="w-24 h-24 rounded-xl object-cover ring-4 ring-[#282a36] shadow-2xl" alt=""/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"><UploadButton endpoint="imageUploader" className="ut-button:bg-transparent ut-button:h-full ut-button:w-full ut-allowed-content:hidden" content={{ button: <Palette className="w-8 h-8 text-white"/> }} onClientUploadComplete={(res) => { if (res?.[0]) setEditImage(res[0].url); }}/></div><div className="flex flex-col gap-3"><span className="text-[11px] font-bold uppercase text-[#6272a4]">Global Role</span><div className="px-4 py-1.5 rounded-lg bg-[#bd93f9]/10 border border-[#bd93f9]/20 text-[#bd93f9] font-bold text-[11px] uppercase tracking-widest">{activeOrg?.role?.toUpperCase() || "MEMBER"}</div></div></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-3"><label className="text-[11px] font-bold uppercase text-[#6272a4] ml-1">Display Name</label><Input value={editName} onChange={e => setEditName(e.target.value)} className="h-14 bg-[#44475a]/20 border-[#44475a] rounded-xl px-6 font-bold text-lg text-[#f8f8f2]"/></div><div className="space-y-3"><label className="text-[11px] font-bold uppercase text-[#6272a4] ml-1">Status / Role</label><Input value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} className="h-14 bg-[#44475a]/20 border-[#44475a] rounded-xl px-6 font-medium text-[#f8f8f2]"/></div></div>
                       <Button onClick={handleUpdateProfile} disabled={isSavingProfile} className="h-14 px-10 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-xl transition-all active:scale-95">{isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-5 h-5 mr-3"/> Save Changes</>}</Button>
                    </div>
                 </div>
               )}
               {activeSettingsTab === "security" && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-3xl font-bold">Security Hub</h2>
                    <p className="text-[#6272a4] mb-12 font-medium mt-2">Authentication is managed via secure email verification pulse.</p>
                    <div className="p-8 rounded-2xl bg-[#50fa7b]/10 border border-[#50fa7b]/20 flex gap-6 items-center">
                       <div className="w-12 h-12 rounded-xl bg-[#50fa7b]/20 flex items-center justify-center text-[#50fa7b]"><Shield className="w-6 h-6" /></div>
                       <div><h4 className="font-bold text-[#50fa7b] text-lg">Passwordless Active</h4><p className="text-[#50fa7b]/70 text-sm mt-1 leading-relaxed">Your account is secured by unique one-time codes sent to your registered email address.</p></div>
                    </div>
                    <div className="mt-10 space-y-4"><div className="flex items-center gap-4 text-[#6272a4] px-2"><Mail className="w-5 h-5" /><span>{session.user.email}</span></div><div className="flex items-center gap-4 text-[#6272a4] px-2"><CheckCircle className="w-5 h-5 text-[#50fa7b]" /><span>Two-factor email pulse verification enabled</span></div></div>
                 </div>
               )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
