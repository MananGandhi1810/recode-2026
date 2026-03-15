"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import LandingPage from "@/components/LandingPage";
import { ArrowRight, LogOut, Layout, MessageSquare, Shield, Zap, Globe } from "lucide-react";

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
  
  useEffect(() => {
    if (session?.user) {
      if (!session.user.name || !session.user.jobTitle) {
        setStep("onboarding");
      } else {
        setStep("orgs");
        loadOrganizations();
      }
    }
  }, [session]);

  const loadOrganizations = async () => {
    try {
      const orgs = await authClient.organization.list();
      if (orgs?.data) setOrganizations(orgs.data);
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
    } catch (err) {
      setError(err?.message || "Failed to create workspace.");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-indigo-600 animate-pulse shadow-lg flex items-center justify-center text-xl font-bold text-white">C</div>
           <div className="text-zinc-500 font-medium text-sm">Loading Chat...</div>
        </div>
      </div>
    );
  }

  if (step === "landing") return <LandingPage onGetStarted={() => setStep("email")} />;

  return (
    <div className="min-h-screen flex text-zinc-100 bg-zinc-950 font-sans">
      {/* Side Visual */}
      <div className="hidden lg:flex w-[40%] flex-col justify-between p-16 bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.05),transparent)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg text-lg italic">N</div>
            Nexus
          </div>
          <p className="mt-8 text-zinc-400 max-w-sm text-lg leading-relaxed font-medium">
            The professional workspace for high-performance teams. Secure, fast, and organized.
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4 text-zinc-300">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-indigo-400"/></div>
              <span className="font-medium">Real-time Messaging</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-300">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><Shield className="w-5 h-5 text-indigo-400"/></div>
              <span className="font-medium">Secure Organizations</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-300">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><Zap className="w-5 h-5 text-indigo-400"/></div>
              <span className="font-medium">Blazing Fast Performance</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
          &copy; 2026 Chat App. All rights reserved.
        </div>
      </div>

      {/* Auth Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-y-auto bg-zinc-950">
        <div className="w-full max-w-[400px] py-12">
          
          {step === "email" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Sign In</h1>
                <p className="text-zinc-500 font-medium">Enter your email to continue to your workspace.</p>
              </div>
              
              {error && <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400 mb-6 font-semibold">{error}</div>}
              
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-zinc-400 ml-1">Work Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-11 bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500/20 rounded-xl px-4 text-white"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? "Sending..." : "Get Access Code"}
                </Button>
                <button type="button" onClick={() => setStep("landing")} className="w-full text-[13px] text-zinc-500 hover:text-zinc-300 transition font-semibold text-center mt-2">Back to Home</button>
              </form>
            </div>
          )}

          {step === "otp" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Verify Email</h1>
                <p className="text-zinc-500 font-medium text-sm">We've sent a code to <span className="text-indigo-400 font-bold">{email}</span></p>
              </div>
              
              {error && <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400 mb-6 font-semibold">{error}</div>}
              
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center block">6-Digit Code</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="000000" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="h-14 text-center text-3xl font-bold tracking-[0.3em] bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500/20 rounded-xl text-white"
                    maxLength={6}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? "Verifying..." : "Continue"}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setStep("email")}
                  className="w-full text-[13px] text-zinc-500 hover:text-zinc-300 transition font-semibold text-center"
                >
                  Resend Code
                </button>
              </form>
            </div>
          )}

          {step === "onboarding" && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Setup Profile</h1>
                <p className="text-zinc-500 font-medium">Tell us a bit about yourself.</p>
              </div>

              {error && <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400 mb-6 font-semibold">{error}</div>}

              <form onSubmit={handleOnboarding} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[13px] font-semibold text-zinc-400 ml-1">Profile Picture</Label>
                  {imageUrl ? (
                    <div className="flex items-center gap-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <img src={imageUrl} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border border-zinc-700 shadow-md" />
                      <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl("")} className="bg-zinc-800 border-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-700 text-zinc-200">Change</Button>
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => { if (res?.[0]) setImageUrl(res[0].url); }}
                      onUploadError={(error) => { alert(`ERROR! ${error.message}`); }}
                      className="border-zinc-800 bg-zinc-900 rounded-xl ut-label:text-zinc-500 ut-button:bg-indigo-600 ut-button:text-white ut-button:font-bold ut-button:rounded-lg ut-button:px-6 h-32"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[13px] font-semibold text-zinc-400 ml-1">Display Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-indigo-500/20 text-white" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-[13px] font-semibold text-zinc-400 ml-1">Job Title / Role</Label>
                    <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-11 bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-indigo-500/20 text-white" placeholder="Product Designer" required />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98] mt-4" disabled={loading}>
                  {loading ? "Saving..." : "Start Chatting"}
                </Button>
              </form>
            </div>
          )}

          {step === "orgs" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Your Workspaces</h1>
                  <p className="text-zinc-500 text-xs font-medium">{session.user.email}</p>
                </div>
                {session.user.image && (
                   <img src={session.user.image} alt="" className="w-10 h-10 rounded-lg border border-zinc-800 shadow-md" />
                )}
              </div>

              {error && <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400 mb-6 font-semibold">{error}</div>}

              <div className="space-y-2.5 mb-10">
                {organizations.map((org) => (
                  <button 
                    key={org.id}
                    onClick={() => router.push(`/chat?orgId=${org.id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {org.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{org.name}</div>
                        <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{org.slug}.chat.app</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                  </button>
                ))}
                {organizations.length === 0 && (
                  <div className="text-center py-12 px-6 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 font-medium text-sm">
                    No workspaces yet. Create one below!
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-zinc-900">
                <h3 className="text-[11px] font-bold text-zinc-500 mb-6 uppercase tracking-widest">Create Workspace</h3>
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</Label>
                      <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="bg-zinc-900 border-zinc-800 h-10 rounded-lg focus-visible:ring-indigo-500/20 text-white px-3 text-[14px]" placeholder="Acme Team" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">URL Slug</Label>
                      <Input value={orgSlug} onChange={e => setOrgSlug(e.target.value)} className="bg-zinc-900 border-zinc-800 h-10 rounded-lg focus-visible:ring-indigo-500/20 text-white px-3 text-[14px]" placeholder="acme" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 rounded-lg border border-zinc-700 transition-all shadow-sm" disabled={loading}>
                    {loading ? "Creating..." : "Launch Workspace"}
                  </Button>
                </form>
              </div>

              <div className="mt-10 flex justify-center">
                <button onClick={() => signOut()} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-rose-400 transition-all font-bold uppercase tracking-widest">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
