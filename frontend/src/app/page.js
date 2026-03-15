"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import LandingPage from "@/components/LandingPage";
import { ArrowRight, LogOut, Layout, MessageSquare, Shield, Zap, Globe, Sparkles, Compass, Plus, Key, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("landing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [publicOrgs, setPublicOrgs] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [activeOrgTab, setOrgTab] = useState("my"); // "my" | "discover" | "join" | "create"

  useEffect(() => {
    if (session?.user) {
      if (!session.user.name || !session.user.jobTitle) {
        setStep("onboarding");
      } else {
        setStep("orgs");
        loadOrganizations();
        loadPublicOrgs();
      }
    }
  }, [session]);

  const loadOrganizations = async () => {
    try {
      const orgs = await authClient.organization.list();
      if (orgs?.data) setOrganizations(orgs.data);
    } catch (e) { console.error(e); }
  };

  const loadPublicOrgs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/public`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setPublicOrgs(json.data);
    } catch (e) { console.error(e); }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.organization.create({ name: orgName, slug: orgSlug });
      if (result?.error) throw result.error;
      setOrgName(""); setOrgSlug("");
      loadOrganizations();
      setOrgTab("my");
    } catch (err) {
      setError(err?.message || "Failed to create workspace.");
    } finally { setLoading(false); }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/join-code`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ joinCode })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Invalid join code");
      setJoinCode("");
      loadOrganizations();
      setOrgTab("my");
    } catch (err) {
      setError(err?.message || "Failed to join workspace.");
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (result?.error) throw result.error;
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Failed to send code.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.emailOtp({ email, otp });
      if (result?.error) throw result.error;
    } catch (err) {
      setError(err?.message || "Invalid code.");
    } finally { setLoading(false); }
  };

  const handleOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/user/profile`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name, image: imageUrl, jobTitle })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Initialization failed");
      await authClient.updateUser({ name, image: imageUrl });
      setStep("orgs");
      loadOrganizations();
    } catch (err) {
      setError(err?.message || "Failed to set up profile.");
    } finally { setLoading(false); }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#282a36] text-[#f8f8f2]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-[#bd93f9] animate-pulse shadow-lg flex items-center justify-center text-xl font-bold text-[#282a36]">N</div>
           <div className="text-[#6272a4] font-medium text-sm">Synchronizing Nexus...</div>
        </div>
      </div>
    );
  }

  if (step === "landing") return <LandingPage onGetStarted={() => setStep("email")} />;

  return (
    <div className="min-h-screen flex text-[#f8f8f2] bg-[#282a36] font-sans selection:bg-[#44475a]">
      {/* Side Visual */}
      <div className="hidden lg:flex w-[40%] flex-col justify-between p-16 bg-[#1e1e22] border-r border-[#44475a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(189,147,249,0.05),transparent)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-[#f8f8f2]">
            <div className="w-9 h-9 rounded-lg bg-[#bd93f9] text-[#282a36] flex items-center justify-center shadow-lg text-lg italic">N</div>
            Nexus
          </div>
          <p className="mt-8 text-[#6272a4] max-w-sm text-lg leading-relaxed font-medium">
            The professional workspace for high-performance squads. Secure, focused, and integrated.
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4 text-[#f8f8f2]">
              <div className="w-10 h-10 rounded-lg bg-[#282a36] border border-[#44475a] flex items-center justify-center shadow-sm"><MessageSquare className="w-5 h-5 text-[#bd93f9]"/></div>
              <span className="font-medium text-sm">Real-time Synchronization</span>
            </div>
            <div className="flex items-center gap-4 text-[#f8f8f2]">
              <div className="w-10 h-10 rounded-lg bg-[#282a36] border border-[#44475a] flex items-center justify-center shadow-sm"><Shield className="w-5 h-5 text-[#50fa7b]"/></div>
              <span className="font-medium text-sm">Enterprise Security Hub</span>
            </div>
            <div className="flex items-center gap-4 text-[#f8f8f2]">
              <div className="w-10 h-10 rounded-lg bg-[#282a36] border border-[#44475a] flex items-center justify-center shadow-sm"><Zap className="w-5 h-5 text-[#f1fa8c]"/></div>
              <span className="font-medium text-sm">Blazing Fast Core</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-[10px] text-[#6272a4] font-bold uppercase tracking-[0.2em]">
          &copy; 2026 Nexus Core. Terminal Access Only.
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-y-auto bg-[#282a36]">
        <div className="w-full max-w-[440px] py-12">
          
          {step === "email" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bd93f9]/10 border border-[#bd93f9]/20 text-[#bd93f9] text-[10px] font-bold uppercase tracking-widest mb-4">Authentication</div>
                <h1 className="text-3xl font-bold text-[#f8f8f2] tracking-tight mb-2">Sign In</h1>
                <p className="text-[#6272a4] font-medium">Enter your terminal credentials to continue.</p>
              </div>
              {error && <div className="p-3.5 rounded-xl bg-[#ff5555]/10 border border-[#ff5555]/20 text-[13px] text-[#ff5555] mb-6 font-semibold">{error}</div>}
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="email" className="text-[11px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Access Email</Label><Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-[#1e1e22] border-[#44475a] focus-visible:ring-[#bd93f9]/20 rounded-xl px-4 text-[#f8f8f2] font-medium" required /></div>
                <Button type="submit" className="w-full h-12 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-lg shadow-[#bd93f9]/10 transition-all active:scale-[0.98]" disabled={loading}>{loading ? "Transmitting..." : "Get Access Code"}</Button>
                <button type="button" onClick={() => setStep("landing")} className="w-full text-[11px] text-[#6272a4] hover:text-[#f8f8f2] transition font-bold uppercase tracking-widest text-center mt-4">Back to Terminal</button>
              </form>
            </div>
          )}

          {step === "otp" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-[#f8f8f2] tracking-tight mb-2">Verify Access</h1>
                <p className="text-[#6272a4] font-medium text-sm">We've transmitted a code to <span className="text-[#bd93f9] font-bold">{email}</span></p>
              </div>
              {error && <div className="p-3.5 rounded-xl bg-[#ff5555]/10 border border-[#ff5555]/20 text-[13px] text-[#ff5555] mb-6 font-semibold">{error}</div>}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3"><Label htmlFor="otp" className="text-[10px] font-bold text-[#6272a4] uppercase tracking-widest text-center block">6-Digit Verification Pulse</Label><Input id="otp" type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} className="h-16 text-center text-3xl font-bold tracking-[0.3em] bg-[#1e1e22] border-[#44475a] focus-visible:ring-[#bd93f9]/20 rounded-xl text-[#f8f8f2]" maxLength={6} required /></div>
                <Button type="submit" className="w-full h-12 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]" disabled={loading}>{loading ? "Verifying Pulse..." : "Establish Connection"}</Button>
                <button type="button" onClick={() => setStep("email")} className="w-full text-[11px] text-[#6272a4] hover:text-[#f8f8f2] transition font-bold uppercase tracking-widest text-center">Resend Code</button>
              </form>
            </div>
          )}

          {step === "onboarding" && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="mb-10"><h1 className="text-3xl font-bold text-[#f8f8f2] tracking-tight mb-2">Nexus Identity</h1><p className="text-[#6272a4] font-medium">Initialize your operator profile.</p></div>
              {error && <div className="p-3.5 rounded-xl bg-[#ff5555]/10 border border-[#ff5555]/20 text-[13px] text-[#ff5555] mb-6 font-semibold">{error}</div>}
              <form onSubmit={handleOnboarding} className="space-y-6">
                <div className="space-y-3"><Label className="text-[11px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Avatar Profile</Label>{imageUrl ? (<div className="flex items-center gap-6 p-4 rounded-xl bg-[#1e1e22] border border-[#44475a]"><img src={imageUrl} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border border-[#44475a] shadow-md" /><Button type="button" variant="outline" size="sm" onClick={() => setImageUrl("")} className="bg-[#282a36] border-[#44475a] rounded-lg text-xs font-bold hover:bg-[#44475a] text-[#f8f8f2]">Change</Button></div>) : (<UploadDropzone endpoint="imageUploader" onClientUploadComplete={(res) => { if (res?.[0]) setImageUrl(res[0].url); }} onUploadError={(error) => { alert(`ERROR! ${error.message}`); }} className="border-[#44475a] bg-[#1e1e22] rounded-xl ut-label:text-[#6272a4] ut-button:bg-[#bd93f9] ut-button:text-[#282a36] ut-button:font-bold ut-button:rounded-lg ut-button:px-6 h-32" />)}</div>
                <div className="space-y-4"><div className="space-y-2"><Label htmlFor="name" className="text-[11px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Operator Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-[#1e1e22] border-[#44475a] rounded-xl focus-visible:ring-[#bd93f9]/20 text-[#f8f8f2] font-semibold" placeholder="John Doe" required /></div><div className="space-y-2"><Label htmlFor="jobTitle" className="text-[11px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Squad Designation</Label><Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-12 bg-[#1e1e22] border-[#44475a] rounded-xl focus-visible:ring-[#bd93f9]/20 text-[#f8f8f2] font-medium" placeholder="Lead Engineer" required /></div></div>
                <Button type="submit" className="w-full h-12 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-lg mt-4 transition-all active:scale-[0.98]" disabled={loading}>{loading ? "Saving Config..." : "Initialize Terminal"}</Button>
              </form>
            </div>
          )}

          {step === "orgs" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1"><h1 className="text-2xl font-bold text-[#f8f8f2] tracking-tight">Nexus Nodes</h1><p className="text-[#6272a4] text-[10px] font-bold uppercase tracking-widest">{session.user.email}</p></div>
                {session.user.image && (<img src={session.user.image} alt="" className="w-10 h-10 rounded-lg border border-[#44475a] shadow-lg" />)}
              </div>

              <div className="flex items-center gap-1 bg-[#1e1e22] p-1 rounded-xl border border-[#44475a] mb-8">
                 <button onClick={() => setOrgTab("my")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeOrgTab === "my" ? "bg-[#bd93f9] text-[#282a36]" : "text-[#6272a4] hover:text-[#f8f8f2]")}><Users className="w-3.5 h-3.5" /> Active</button>
                 <button onClick={() => { setOrgTab("discover"); loadPublicOrgs(); }} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeOrgTab === "discover" ? "bg-[#bd93f9] text-[#282a36]" : "text-[#6272a4] hover:text-[#f8f8f2]")}><Compass className="w-3.5 h-3.5" /> Discover</button>
                 <button onClick={() => setOrgTab("join")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeOrgTab === "join" ? "bg-[#bd93f9] text-[#282a36]" : "text-[#6272a4] hover:text-[#f8f8f2]")}><Key className="w-3.5 h-3.5" /> Join</button>
                 <button onClick={() => setOrgTab("create")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeOrgTab === "create" ? "bg-[#bd93f9] text-[#282a36]" : "text-[#6272a4] hover:text-[#f8f8f2]")}><Plus className="w-3.5 h-3.5" /> New</button>
              </div>

              {error && <div className="p-3.5 rounded-xl bg-[#ff5555]/10 border border-[#ff5555]/20 text-[13px] text-[#ff5555] mb-6 font-semibold">{error}</div>}

              {activeOrgTab === "my" && (
                <div className="space-y-3 mb-10">
                  {organizations.map((org) => (
                    <button key={org.id} onClick={() => router.push(`/chat?orgId=${org.id}`)} className="w-full flex items-center justify-between p-4 rounded-xl border border-[#44475a] bg-[#1e1e22] hover:bg-[#44475a]/30 hover:border-[#bd93f9]/30 transition-all group text-left">
                      <div className="flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-[#282a36] text-[#bd93f9] border border-[#44475a] flex items-center justify-center font-bold text-lg group-hover:bg-[#bd93f9] group-hover:text-[#282a36] transition-all shadow-sm">{org.name[0].toUpperCase()}</div><div><div className="font-bold text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors">{org.name}</div><div className="text-[10px] text-[#6272a4] font-bold uppercase tracking-wider mt-0.5">{org.slug}.nexus.core</div></div></div>
                      <ArrowRight className="w-5 h-5 text-[#44475a] group-hover:text-[#bd93f9] transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                  {organizations.length === 0 && (<div className="text-center py-12 px-6 border border-dashed border-[#44475a] rounded-2xl text-[#6272a4] font-medium text-sm">No active nexus nodes.</div>)}
                </div>
              )}

              {activeOrgTab === "discover" && (
                <div className="space-y-3 mb-10">
                  {publicOrgs.map((org) => (
                    <div key={org.id} className="w-full flex items-center justify-between p-4 rounded-xl border border-[#44475a] bg-[#1e1e22]">
                      <div className="flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-[#282a36] text-[#50fa7b] border border-[#44475a] flex items-center justify-center font-bold text-lg">{org.name[0].toUpperCase()}</div><div><div className="font-bold text-[#f8f8f2]">{org.name}</div><div className="text-[10px] text-[#6272a4] font-bold uppercase tracking-wider mt-0.5">{org._count.members} Operators</div></div></div>
                      <Button onClick={async () => {
                        if (!org.joinCode) {
                          alert("This public node does not have a join code available.");
                          return;
                        }
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/orgs/join-code`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ joinCode: org.joinCode }) });
                        if (res.ok) { loadOrganizations(); setOrgTab("my"); }
                        else {
                          const json = await res.json();
                          alert(json.message || "Failed to join node.");
                        }
                      }} className="h-9 px-4 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-bold rounded-lg text-xs">Join Node</Button>
                    </div>
                  ))}
                  {publicOrgs.length === 0 && (<div className="text-center py-12 px-6 border border-dashed border-[#44475a] rounded-2xl text-[#6272a4] font-medium text-sm">No public nodes discovered.</div>)}
                </div>
              )}

              {activeOrgTab === "join" && (
                <form onSubmit={handleJoinByCode} className="space-y-6 mb-10">
                   <div className="space-y-3"><Label className="text-[10px] font-bold text-[#6272a4] uppercase tracking-[0.2em] ml-1">Terminal Access Code</Label><Input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="NX-XXXXXX" className="h-14 text-center text-2xl font-bold tracking-[0.2em] bg-[#1e1e22] border-[#44475a] focus-visible:ring-[#bd93f9]/20 rounded-xl text-[#f8f8f2]" required /></div>
                   <Button type="submit" disabled={loading} className="w-full h-12 bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">Authenticate & Join</Button>
                </form>
              )}

              {activeOrgTab === "create" && (
                <form onSubmit={handleCreateOrg} className="space-y-4 mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Node Name</Label><Input value={orgName} onChange={e => setOrgName(e.target.value)} className="bg-[#1e1e22] border-[#44475a] h-11 rounded-lg focus-visible:ring-[#bd93f9]/20 text-[#f8f8f2] px-3 font-semibold text-sm" placeholder="Acme Team" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold text-[#6272a4] uppercase tracking-widest ml-1">Terminal Slug</Label><Input value={orgSlug} onChange={e => setOrgSlug(e.target.value)} className="bg-[#1e1e22] border-[#44475a] h-11 rounded-lg focus-visible:ring-[#bd93f9]/20 text-[#f8f8f2] px-3 font-semibold text-sm" placeholder="acme" required /></div>
                  </div>
                  <Button type="submit" className="w-full bg-[#bd93f9] hover:bg-[#bd93f9]/80 text-[#282a36] font-bold h-11 rounded-lg transition-all shadow-md" disabled={loading}>{loading ? "Deploying Node..." : "Establish Workspace"}</Button>
                </form>
              )}

              <div className="mt-10 flex justify-center border-t border-[#44475a] pt-8">
                <button onClick={() => signOut()} className="flex items-center gap-2 text-[10px] text-[#6272a4] hover:text-[#ff5555] transition-all font-bold uppercase tracking-widest"><LogOut className="w-4 h-4" /> Terminate Session</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
