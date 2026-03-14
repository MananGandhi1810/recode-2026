"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient, useSession, signOut } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Use the emailOTPClient plugin
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in"
      });
      if (result?.error) throw result.error;
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the signIn.emailOtp method
      const result = await authClient.signIn.emailOtp({
        email,
        otp
      });
      if (result?.error) throw result.error;
      // Session automatically refreshes!
    } catch (err) {
      setError(err?.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-24">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  // Logged-in State (Session Active)
  if (session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>You are authenticated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium text-sm mb-2">Organizations (Plugin active)</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => alert("Organization creation feature coming soon!")}
                >
                  Create Organization
                </Button>
              </div>
            </div>

            <div className="pt-6">
              <Button variant="destructive" className="w-full" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Logged-out State (Auth Flow)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your email to receive a one-time password.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep("email")}
              >
                Back to Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
