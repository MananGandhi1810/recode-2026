"use client";

import { cn } from "@/lib/utils";
import { Hash, Plus, ChevronDown, Settings, Mic, Headphones, MessageSquare, Shield } from "lucide-react";

export default function ChannelSidebar({ 
  orgName, 
  channels, 
  dms = [],
  activeChannelId, 
  onChannelSelect, 
  onCreateChannelClick,
  onOrgSettingsClick,
  user,
  hasAdminPrivileges
}) {
  return (
    <aside className="w-[240px] h-full bg-zinc-900 flex flex-col flex-shrink-0 border-r border-zinc-800/50">
      {/* Header */}
      <div className="relative group">
        <button className="w-full h-12 px-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-950/50">
          <span className="font-bold text-[14px] text-zinc-100 truncate">{orgName}</span>
          <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>
        
        {hasAdminPrivileges && (
          <button 
            onClick={onOrgSettingsClick}
            className="absolute right-10 top-3 p-1 rounded-md bg-indigo-600/10 text-indigo-400 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            title="Organization Settings"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        <div className="mb-6">
          <div className="flex items-center justify-between px-2 mb-2 group/title">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 group-hover/title:text-zinc-400 transition-colors">Text Channels</h3>
            {hasAdminPrivileges && (
              <button 
                onClick={onCreateChannelClick}
                className="text-zinc-500 hover:text-zinc-200 transition-all p-0.5 rounded-md hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="space-y-0.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onChannelSelect(ch)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[14px] font-medium transition-all group",
                  activeChannelId === ch.id 
                    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                )}
              >
                <Hash className={cn(
                  "w-4 h-4 shrink-0",
                  activeChannelId === ch.id ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-400"
                )} />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-2 mb-2 group/title">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 group-hover/title:text-zinc-400 transition-colors">Direct Messages</h3>
            <button className="text-zinc-500 hover:text-zinc-200 transition-all p-0.5 rounded-md hover:bg-zinc-800">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-0.5">
            {dms.map((dm) => {
              const otherMember = dm.channelMembers?.find(cm => cm.member?.userId !== user?.id);
              const otherUser = otherMember?.member?.user;
              return (
                <button
                  key={dm.id}
                  onClick={() => onChannelSelect(dm)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[14px] font-medium transition-all group",
                    activeChannelId === dm.id 
                      ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                      : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                  )}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={otherUser?.image || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}&background=27272a&color=e4e4e7`} 
                      className="w-5 h-5 rounded-md object-cover" 
                      alt="" 
                    />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900",
                      otherUser?.status === "ONLINE" ? "bg-emerald-500" : "bg-zinc-500"
                    )} />
                  </div>
                  <span className="truncate">{otherUser?.name || "Unknown User"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Status Section */}
      <div className="bg-zinc-950/40 p-2.5 mt-auto border-t border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-all group cursor-pointer">
            <div className="relative shrink-0">
              <img 
                src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=27272a&color=e4e4e7`} 
                className="w-8 h-8 rounded-lg object-cover shadow-sm border border-zinc-800" 
                alt="" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-zinc-100 truncate leading-none group-hover:text-white">{user?.name}</div>
              <div className="text-[10px] text-zinc-500 truncate leading-tight mt-1">Online</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-all" title="Mute">
              <Mic className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-all" title="Deafen">
              <Headphones className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-all" title="User Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
