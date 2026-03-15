"use client";

import { cn } from "@/lib/utils";
import { Plus, MessageSquare } from "lucide-react";

export default function ServerSidebar({ organizations, activeOrgId, onOrgSelect, onCreateClick }) {
  return (
    <aside className="w-[72px] h-full bg-[#1e1e22] flex flex-col items-center py-4 gap-3 z-30 border-r border-[#44475a]/30">
      <div 
        onClick={() => onOrgSelect(null)}
        className="w-12 h-12 bg-[#44475a] rounded-2xl flex items-center justify-center text-[#bd93f9] shadow-lg mb-2 group cursor-pointer transition-all hover:rounded-xl hover:bg-[#bd93f9] hover:text-[#282a36]"
      >
         <MessageSquare className="w-7 h-7" />
      </div>
      
      <div className="w-8 h-[2px] bg-[#44475a] rounded-full mb-1" />

      <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => onOrgSelect(org.id)}
            className="relative group flex items-center"
          >
            <div className={cn(
              "absolute left-0 w-1 bg-[#f8f8f2] rounded-r-full transition-all duration-200",
              activeOrgId === org.id ? "h-8" : "h-0 group-hover:h-4"
            )} />
            <div className={cn(
              "w-12 h-12 flex items-center justify-center transition-all duration-200 shadow-md",
              activeOrgId === org.id ? "rounded-xl bg-[#bd93f9] text-[#282a36]" : "rounded-3xl bg-[#44475a] text-[#f8f8f2] hover:rounded-xl hover:bg-[#ff79c6] hover:text-[#282a36]"
            )}>
              <span className="font-bold text-sm uppercase">{org.name?.[0]}</span>
            </div>
          </button>
        ))}

        <button 
          onClick={onCreateClick}
          className="w-12 h-12 rounded-3xl bg-[#44475a] flex items-center justify-center text-[#50fa7b] transition-all hover:rounded-xl hover:bg-[#50fa7b] hover:text-[#282a36] group"
        >
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
        </button>
      </div>
    </aside>
  );
}
