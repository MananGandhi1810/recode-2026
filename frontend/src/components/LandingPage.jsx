"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe, MessageSquare, Layers, Users, ArrowRight, CheckCircle, Smartphone, Share2, Star, Play, Sparkles } from "lucide-react";

const Nav = ({ onGetStarted }) => (
  <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 italic">N</div>
        Nexus
      </div>
      <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
        <a href="#security" className="hover:text-white transition-colors">Security</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors" onClick={onGetStarted}>Sign In</button>
        <Button onClick={onGetStarted} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
          Get Started
        </Button>
      </div>
    </div>
  </nav>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 group shadow-xl">
    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
      <Icon className="w-6 h-6 text-indigo-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-zinc-400 leading-relaxed text-[14px] font-medium">{description}</p>
  </div>
);

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/20 overflow-x-hidden">
      <Nav onGetStarted={onGetStarted} />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New: Threaded conversations are here
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 max-w-4xl leading-[1.1]"
          >
            The simplest way to <br /> 
            <span className="text-indigo-500 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">chat with your team.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-medium"
          >
            Everything your team needs to stay connected. Fast messaging, organized channels, and easy file sharing in a clean, professional workspace.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button onClick={onGetStarted} size="lg" className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-xl shadow-indigo-500/20 group transition-all active:scale-95">
              Create Your Workspace <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button onClick={onGetStarted} size="lg" variant="outline" className="h-14 px-10 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold text-base rounded-xl transition-all active:scale-95">
              Sign In
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-zinc-500 max-w-xl mx-auto font-medium text-lg">A powerful set of features designed to help your team work better together.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={MessageSquare} 
              title="Organized Channels" 
              description="Keep your conversations focused in dedicated channels for every project, team, or topic."
            />
            <FeatureCard 
              icon={Zap} 
              title="Instant Messaging" 
              description="Real-time message delivery across all your devices. Never miss a beat with lightning-fast sync."
            />
            <FeatureCard 
              icon={Layers} 
              title="File Sharing" 
              description="Easily share documents, images, and other files directly in your conversations."
            />
            <FeatureCard 
              icon={Shield} 
              title="Secure by Default" 
              description="Enterprise-grade security and role-based access controls to keep your data safe."
            />
            <FeatureCard 
              icon={Smartphone} 
              title="Mobile Friendly" 
              description="Stay connected on the go with a responsive design that works perfectly on any device."
            />
            <FeatureCard 
              icon={Globe} 
              title="Multiple Teams" 
              description="Manage all your different teams and organizations from a single, easy-to-use interface."
            />
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 px-6 bg-zinc-900/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl p-1">
              <div className="h-8 bg-zinc-900 flex items-center gap-1.5 px-4 border-b border-zinc-800">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
              <div className="p-8 h-[350px] flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0 border border-zinc-700" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-3.5 bg-zinc-800 rounded-md w-1/4" />
                    <div className="h-3.5 bg-zinc-800 rounded-md w-full" />
                  </div>
                </div>
                <div className="flex gap-4 ml-8">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 shrink-0 border border-indigo-500/20" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-3.5 bg-indigo-500/30 rounded-md w-1/5" />
                    <div className="h-3.5 bg-indigo-500/30 rounded-md w-5/6" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0 border border-zinc-700" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-3.5 bg-zinc-800 rounded-md w-1/3" />
                    <div className="h-3.5 bg-zinc-800 rounded-md w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-[11px] font-bold text-indigo-400 mb-6 uppercase tracking-wider border border-indigo-500/20">
              Operations
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-[1.2]">Designed for modern teams.</h2>
            <div className="space-y-6 mb-10">
              {[
                "Create private or public channels for any topic",
                "Advanced permissions and role management",
                "Seamless file sharing and media previews",
                "Real-time presence and status updates"
              ].map(item => (
                <div key={item} className="flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-zinc-300 font-semibold text-lg">{item}</span>
                </div>
              ))}
            </div>
            <Button onClick={onGetStarted} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-10 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
               Try Nexus Free
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="security" className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-[2rem] p-12 md:p-20 bg-indigo-600 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Ready to start?</h2>
          <p className="text-white/80 text-lg md:text-xl font-semibold mb-10 max-w-2xl mx-auto">Join thousands of teams already using Nexus to communicate better.</p>
          <Button onClick={onGetStarted} size="lg" className="h-16 px-12 bg-white hover:bg-zinc-100 text-indigo-600 font-bold rounded-xl text-lg shadow-xl transition-all active:scale-95">
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-zinc-800 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2.5 font-bold text-2xl text-white">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white italic">N</div>
              Nexus
            </div>
            <p className="text-zinc-500 text-sm font-medium">Professional team collaboration, simplified.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-10 text-[13px] font-semibold text-zinc-500">
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Features</button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Security</button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Support</button>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-zinc-600 text-sm font-medium">© 2026 Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
