"use client";

import { cn } from "@/lib/utils";
import { Plus, LayoutDashboard, Bell } from "lucide-react";

export default function ServerSidebar({ organizations, activeOrgId, onOrgSelect, onSettingsClick, userImage, userName }) {
  return (
    <aside className="w-[72px] h-full bg-zinc-950 flex flex-col items-center py-3 gap-2 flex-shrink-0 border-r border-zinc-900/50">
      {/* Home / Global Hub */}
      <ServerIcon 
        icon={LayoutDashboard} 
        active={!activeOrgId} 
        onClick={() => onOrgSelect(null)} 
        tooltip="Nexus Home"
      />
      
      <div className="w-8 h-[2px] bg-zinc-800 rounded-full mx-auto my-1" />
      
      {/* Organizations */}
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pb-4">
        {organizations.map((org) => (
          <ServerIcon 
            key={org.id}
            name={org.name}
            active={activeOrgId === org.id}
            onClick={() => onOrgSelect(org.id)}
            tooltip={org.name}
          />
        ))}
        
        <button className="w-12 h-12 rounded-[24px] bg-zinc-900 flex items-center justify-center text-emerald-500 hover:bg-emerald-600 hover:text-white hover:rounded-[16px] transition-all duration-200 group mx-3">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-3 items-center pb-4">
        <button className="w-12 h-12 rounded-[24px] bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-indigo-600 hover:text-white hover:rounded-[16px] transition-all duration-200 group mx-3">
          <Bell className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onSettingsClick}
          className="relative group mx-3"
        >
          <img 
            src={userImage || `https://ui-avatars.com/api/?name=${userName}&background=27272a&color=e4e4e7`} 
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 object-cover border-2 border-transparent group-hover:border-indigo-500 shadow-md" 
            alt="User"
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-zinc-950 shadow-sm" />
        </button>
      </div>
    </aside>
  );
}

function ServerIcon({ name, icon: Icon, active, onClick, tooltip }) {
  return (
    <div className="relative flex items-center group">
      {/* Active Indicator */}
      <div className={cn(
        "absolute left-0 w-1 bg-zinc-100 rounded-r-full transition-all duration-200",
        active ? "h-10" : "h-2 group-hover:h-5 opacity-0 group-hover:opacity-100"
      )} />
      
      <button
        onClick={onClick}
        title={tooltip}
        className={cn(
          "w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden ml-3",
          active 
            ? "rounded-[16px] bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
            : "rounded-[24px] bg-zinc-900 text-zinc-400 hover:rounded-[16px] hover:bg-indigo-600 hover:text-white"
        )}
      >
        {Icon ? (
          <Icon className="w-6 h-6" />
        ) : (
          <span className="text-lg font-bold uppercase">{name?.[0]}</span>
        )}
      </button>
    </div>
  );
}
