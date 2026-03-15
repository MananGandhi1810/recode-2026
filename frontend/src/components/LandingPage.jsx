"use client";

import { MessageSquare, Zap, Shield, Github, ChevronRight, Lock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="p-8 rounded-2xl bg-[#282a36] border border-[#44475a] hover:border-[#bd93f9]/50 transition-all duration-300">
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6", color)}>
      <Icon className="w-6 h-6 text-[#282a36]" />
    </div>
    <h3 className="text-xl font-semibold text-[#f8f8f2] mb-3">{title}</h3>
    <p className="text-[#6272a4] leading-relaxed text-sm">{description}</p>
  </div>
);

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#282a36] text-[#f8f8f2] font-sans selection:bg-[#44475a]">
      {/* Simple Header */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#bd93f9] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-[#282a36]" />
          </div>
          <span className="text-xl font-bold tracking-tight">NEXUS</span>
        </div>
        <Button 
          onClick={onGetStarted}
          className="bg-[#bd93f9] hover:bg-[#bd93f9]/90 text-[#282a36] font-bold rounded-xl px-6"
        >
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#44475a] border border-[#6272a4] text-[#bd93f9] text-xs font-bold uppercase tracking-widest mb-8">
            Digital Workspace
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
            High performance <span className="text-[#bd93f9]">team sync</span>.
          </h1>
          <p className="text-xl text-[#6272a4] mb-12 leading-relaxed">
            A minimal, real-time communication platform built for modern squads. 
            No fluff, just pure speed and security.
          </p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="h-14 px-8 bg-[#bd93f9] hover:bg-[#bd93f9]/90 text-[#282a36] font-bold rounded-xl text-lg shadow-xl shadow-[#bd93f9]/10"
            >
              Get Started <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features - Actual functional ones */}
      <section className="bg-[#1e1e22] py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl font-bold mb-4">Functional by design.</h2>
            <p className="text-[#6272a4] max-w-xl">Every feature is built to keep your team in sync without the noise.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap}
              title="Real-time Engine"
              description="Built on WebSockets for sub-100ms message delivery and instant reaction updates."
              color="bg-[#f1fa8c]"
            />
            <FeatureCard 
              icon={Lock}
              title="Private Channels"
              description="Granular access control. Keep sensitive discussions strictly between invited members."
              color="bg-[#50fa7b]"
            />
            <FeatureCard 
              icon={Hash}
              title="Threaded Context"
              description="Smart reply system with smooth scrolling to keep conversations organized."
              color="bg-[#8be9fd]"
            />
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#44475a]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded-lg bg-[#bd93f9] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#282a36]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[#f8f8f2]">NEXUS</span>
          </div>
          <p className="text-[#6272a4] text-xs font-medium">© 2026 Nexus Core. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
