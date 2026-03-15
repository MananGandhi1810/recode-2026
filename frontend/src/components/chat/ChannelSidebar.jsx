"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Hash, Plus, ChevronDown, Settings, Shield, Search, AtSign, Lock } from "lucide-react";

export default function ChannelSidebar({ 
  orgName, 
  organizations = [],
  activeOrgId,
  onOrgSelect,
  channels = [], 
  dms = [],
  activeChannelId, 
  onChannelSelect, 
  onCreateChannelClick,
  onOrgSettingsClick,
  user,
  hasAdminPrivileges,
  onUserSettingsClick,
  searchQuery,
  setSearchQuery,
  unreadState = {}
}) {
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  // Admins can see all channels, including private ones
  const filteredChannels = channels.filter(c => {
    if (!c.isPrivate) return c.name.toLowerCase().includes(searchQuery?.toLowerCase() || "");
    // Show private channels if user is a member or has admin privileges
    const isMember = c.channelMembers?.some(cm => cm.member?.userId === user?.id);
    if (isMember || hasAdminPrivileges) return c.name.toLowerCase().includes(searchQuery?.toLowerCase() || "");
    return false;
  });
  const filteredDms = dms.filter(d => {
    const otherMember = d.channelMembers?.find(cm => cm.member?.userId !== user?.id);
    return otherMember?.member?.user?.name.toLowerCase().includes(searchQuery?.toLowerCase() || "");
  });

  return (
    <aside className="w-[280px] h-full bg-[#1e1e22] flex flex-col flex-shrink-0 border-r border-[#44475a]/30 shadow-[20px_0_50px_rgba(0,0,0,0.1)] z-20">
      {/* Organization Header */}
      <div className="p-4">
        <div className="relative">
          <button 
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className={cn(
              "w-full h-14 px-4 flex items-center justify-between rounded-xl transition-all border group bg-[#44475a]/20 border-[#44475a]/30 hover:border-[#bd93f9]/30",
              isOrgDropdownOpen && "bg-[#44475a]/40 border-[#bd93f9]/50 ring-2 ring-[#bd93f9]/10"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#bd93f9] to-[#ff79c6] flex items-center justify-center text-[#282a36] font-bold text-xs shrink-0 shadow-lg">
                  {orgName?.[0] || "N"}
               </div>
               <span className="font-semibold text-sm text-[#f8f8f2] truncate tracking-tight">{orgName}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-[#6272a4] transition-transform duration-200", isOrgDropdownOpen && "rotate-180")} />
          </button>

          {isOrgDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#282a36] border border-[#44475a] rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
               <div className="mb-2 px-2 py-1.5 text-[10px] font-bold uppercase text-[#6272a4] tracking-widest">Switch Workspace</div>
               {organizations.map(org => (
                 <button 
                   key={org.id} 
                   onClick={() => { onOrgSelect(org.id); setIsOrgDropdownOpen(false); }}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all mb-1 last:mb-0",
                     activeOrgId === org.id ? "bg-[#bd93f9]/10 text-[#bd93f9] font-bold" : "text-[#6272a4] hover:bg-[#44475a]/30 hover:text-[#f8f8f2]"
                   )}
                 >
                   <div className="w-6 h-6 rounded-md bg-[#44475a] flex items-center justify-center font-bold text-[10px] uppercase">
                     {org.name?.[0]}
                   </div>
                   <span className="text-xs truncate">{org.name}</span>
                 </button>
               ))}
               <div className="h-[1px] bg-[#44475a] my-2" />
               <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6272a4] hover:bg-[#44475a]/30 hover:text-[#f8f8f2] transition-all text-xs font-medium">
                 <Plus className="w-4 h-4" /> New Workspace
               </button>
               {hasAdminPrivileges && (
                 <button 
                  onClick={() => { onOrgSettingsClick(); setIsOrgDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#bd93f9] hover:bg-[#bd93f9]/10 transition-all text-xs font-semibold"
                 >
                   <Shield className="w-4 h-4" /> Workspace Settings
                 </button>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="px-4 mb-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6272a4] group-focus-within:text-[#bd93f9] transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nexus..." 
            className="w-full h-11 pl-10 pr-4 bg-[#44475a]/20 border border-[#44475a]/30 rounded-xl text-xs text-[#f8f8f2] placeholder:text-[#6272a4] outline-none focus:border-[#bd93f9]/30 transition-all"
          />
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {/* Text Channels */}
        <div className="mb-8 mt-4">
          <div className="flex items-center justify-between px-2 mb-3 group/title">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6272a4] group-hover/title:text-[#9ea8c7] transition-colors">Channels</h3>
            {hasAdminPrivileges && (
              <button 
                onClick={onCreateChannelClick}
                className="text-[#6272a4] hover:text-[#f8f8f2] transition-all p-1 rounded-lg hover:bg-[#44475a]/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {filteredChannels.map((ch) => {
              const status = unreadState[ch.id];
              return (
                <button
                  key={ch.id}
                  onClick={() => onChannelSelect(ch)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative font-medium",
                    activeChannelId === ch.id 
                      ? "bg-[#bd93f9] text-[#282a36] shadow-lg shadow-[#bd93f9]/20" 
                      : status ? "text-[#f8f8f2] font-bold" : "text-[#6272a4] hover:bg-[#44475a]/30 hover:text-[#f8f8f2]"
                  )}
                >
                  {ch.isPrivate ? (
                    <Lock className={cn(
                      "w-4 h-4 shrink-0",
                      activeChannelId === ch.id ? "text-[#282a36]" : "text-[#6272a4] group-hover:text-[#9ea8c7]"
                    )} />
                  ) : (
                    <Hash className={cn(
                      "w-4 h-4 shrink-0",
                      activeChannelId === ch.id ? "text-[#282a36]" : "text-[#6272a4] group-hover:text-[#9ea8c7]"
                    )} />
                  )}
                  <span className="truncate">{ch.name}</span>
                  
                  {status === 'unread' && activeChannelId !== ch.id && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#f8f8f2] rounded-full shadow-sm" />
                  )}
                  {status === 'mention' && activeChannelId !== ch.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#ff5555] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-in zoom-in-50 duration-200">
                       <AtSign className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {activeChannelId === ch.id && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#f8f8f2] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DMs Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-3 group/title">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6272a4] group-hover/title:text-[#9ea8c7] transition-colors">Messages</h3>
          </div>
          
          <div className="space-y-1">
            {filteredDms.map((dm) => {
              const otherMember = dm.channelMembers?.find(cm => cm.member?.userId !== user?.id);
              const otherUser = otherMember?.member?.user;
              const status = unreadState[dm.id];
              return (
                <button
                  key={dm.id}
                  onClick={() => onChannelSelect(dm)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative font-medium",
                    activeChannelId === dm.id 
                      ? "bg-[#44475a] text-[#f8f8f2] border border-[#6272a4]/30" 
                      : status ? "text-[#f8f8f2] font-bold" : "text-[#6272a4] hover:bg-[#44475a]/30 hover:text-[#f8f8f2]"
                  )}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={otherUser?.image || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}&background=44475a&color=f8f8f2`} 
                      className="w-6 h-6 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" 
                      alt="" 
                    />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1e1e22]",
                      otherUser?.status === "ONLINE" ? "bg-[#50fa7b]" : "bg-[#6272a4]"
                    )} />
                  </div>
                  <span className="truncate">{otherUser?.name || "Unknown"}</span>
                  
                  {status === 'unread' && activeChannelId !== dm.id && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#f8f8f2] rounded-full shadow-sm" />
                  )}
                  {status === 'mention' && activeChannelId !== dm.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#ff5555] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-in zoom-in-50 duration-200">
                       <AtSign className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer Section */}
      <div className="p-4 bg-[#1e1e22] border-t border-[#44475a]/30">
        <div className="bg-[#44475a]/20 border border-[#44475a]/30 rounded-xl p-2 flex items-center gap-2">
          <div onClick={onUserSettingsClick} className="flex-1 flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#44475a]/40 transition-all group cursor-pointer min-w-0">
            <div className="relative shrink-0">
              <img 
                src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=44475a&color=f8f8f2`} 
                className="w-10 h-10 rounded-xl object-cover shadow-lg border border-[#44475a]/50" 
                alt="" 
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#50fa7b] rounded-full border-[3px] border-[#1e1e22] shadow-md" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#f8f8f2] truncate tracking-tight">{user?.name}</div>
              <div className="text-[9px] font-bold text-[#6272a4] uppercase tracking-widest mt-0.5">Online</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
