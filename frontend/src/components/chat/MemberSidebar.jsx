"use client";

import { cn } from "@/lib/utils";
import { Shield, MoreVertical, MessageSquare } from "lucide-react";

export default function MemberSidebar({ members, onMemberClick }) {
  const onlineMembers = members.filter(m => m.user.status === "ONLINE" || !m.user.status || m.user.status === "online");    
  const offlineMembers = members.filter(m => m.user.status === "OFFLINE" || m.user.status === "offline");

  return (
    <aside className="w-[260px] h-full bg-[#1e1e22] flex flex-col flex-shrink-0 border-l border-[#44475a]/30 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-10">
      <div className="h-14 px-6 flex items-center border-b border-[#44475a]/30 bg-[#1e1e22]/80 backdrop-blur-md">
         <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6272a4]">Workspace Hub</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#50fa7b]">Online</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#50fa7b]/10 text-[#50fa7b] text-[10px] font-bold border border-[#50fa7b]/20">{onlineMembers.length}</span>
          </div>
          <div className="space-y-1">
            {onlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} onClick={() => onMemberClick?.(member)} />
            ))}
          </div>
        </div>

        {offlineMembers.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-4 opacity-50">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6272a4]">Offline</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#44475a]/20 text-[#6272a4] text-[10px] font-bold border border-[#44475a]/30">{offlineMembers.length}</span>
            </div>
            <div className="space-y-1">
              {offlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} offline onClick={() => onMemberClick?.(member)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function MemberItem({ member, offline, onClick }) {
  const highestRole = member.memberRoles?.sort((a, b) => (b.role?.position || 0) - (a.role?.position || 0))[0]?.role;       
  const roleColor = highestRole?.color || (member.role === 'owner' || member.role === 'admin' ? '#ff5555' : null);

  return (
    <div
      onClick={onClick}
      className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative border border-transparent",
      offline ? "opacity-40 hover:opacity-100 hover:bg-[#44475a]/20" : "hover:bg-[#44475a]/30 hover:border-[#44475a]/50"
    )}>
      <div className="relative shrink-0">
        <img
          src={member.user.image || `https://ui-avatars.com/api/?name=${member.user.name}&background=44475a&color=f8f8f2`}  
          className={cn(
            "w-10 h-10 rounded-xl object-cover border border-[#44475a] shadow-lg transition-all",
            offline ? "grayscale" : "grayscale-0"
          )} 
          alt=""
        />
        {!offline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#50fa7b] rounded-full border-[3px] border-[#1e1e22] shadow-md" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "text-xs font-semibold truncate tracking-tight",
              offline ? "text-[#6272a4] group-hover:text-[#f8f8f2]" : "text-[#f8f8f2]"
            )}
            style={!offline && roleColor ? { color: roleColor } : {}}
          >
            {member.user.name}
          </div>
          {highestRole && (
            <Shield className="w-3 h-3 text-[#6272a4] shrink-0" />
          )}
        </div>
        {member.user.jobTitle && (
          <div className="text-[9px] text-[#6272a4] truncate leading-none mt-1 font-bold uppercase tracking-widest">{member.user.jobTitle}</div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
         <MoreVertical className="w-4 h-4 text-[#6272a4]" />
      </div>
    </div>
  );
}
