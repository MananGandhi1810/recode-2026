"use client";

import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export default function MemberSidebar({ members, onMemberClick }) {
  const onlineMembers = members.filter(m => m.user.status === "ONLINE" || !m.user.status || m.user.status === "online"); 
  const offlineMembers = members.filter(m => m.user.status === "OFFLINE" || m.user.status === "offline");

  return (
    <aside className="w-[240px] h-full bg-zinc-900 flex flex-col flex-shrink-0 border-l border-zinc-800/50">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-3 flex items-center justify-between">
            <span>Online — {onlineMembers.length}</span>
          </h3>
          <div className="space-y-0.5">
            {onlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} onClick={() => onMemberClick?.(member)} />
            ))}
          </div>
        </div>

        {offlineMembers.length > 0 && (
          <div className="pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-3">Offline — {offlineMembers.length}</h3>
            <div className="space-y-0.5">
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
  // Get highest role color
  const highestRole = member.memberRoles?.sort((a, b) => (b.role?.position || 0) - (a.role?.position || 0))[0]?.role;
  const roleColor = highestRole?.color || (member.role === 'owner' || member.role === 'admin' ? '#f43f5e' : null);

  return (
    <div 
      onClick={onClick}
      className={cn(
      "flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer group relative",
      offline ? "opacity-40 hover:opacity-100 hover:bg-zinc-800/40" : "hover:bg-zinc-800/40"
    )}>
      <div className="relative shrink-0">
        <img 
          src={member.user.image || `https://ui-avatars.com/api/?name=${member.user.name}&background=27272a&color=e4e4e7`} 
          className="w-8 h-8 rounded-lg object-cover border border-zinc-800 shadow-sm" 
          alt="" 
        />
        {!offline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-sm" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div 
            className={cn(
              "text-[13.5px] font-bold truncate",
              offline ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-200 group-hover:text-white"
            )}
            style={!offline && roleColor ? { color: roleColor } : {}}
          >
            {member.user.name}
          </div>
          {highestRole && (
            <Shield className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
          )}
        </div>
        {member.user.jobTitle && (
          <div className="text-[10px] text-zinc-500 truncate leading-none mt-0.5 font-semibold uppercase tracking-wider">{member.user.jobTitle}</div>
        )}
      </div>
      
      {/* Hidden manage hint */}
      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Manage</div>
      </div>
    </div>
  );
}
