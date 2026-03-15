"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function AcceptInvitationPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Call the hook at the top level of the component
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await authClient.organization.acceptInvitation({
        invitationId: resolvedParams.id,
      });

      if (err) {
        throw new Error(err.message || "Failed to accept invitation");
      }

      // Automatically set the newly joined organization as active
      if (data && data.organizationId) {
        await authClient.organization.setActive({
          organizationId: data.organizationId,
        });
      }

      router.push("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginFirst = () => {
    router.push("/");
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/40">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Organization Invitation</CardTitle>
          <CardDescription className="text-base text-muted-foreground pt-2">
            You've been invited to join an organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/20">
              {error}
            </div>
          )}

          {!isAuthenticated ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                You must be logged in to accept this invitation.
              </p>
            </div>
          ) : (
             <div className="text-center space-y-4">
               <p className="text-sm font-medium">
                 Ready to join? Click the button below to accept your invitation.
               </p>
             </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          {!isAuthenticated ? (
            <Button 
              size="lg" 
              className="w-full font-semibold" 
              onClick={handleLoginFirst}
            >
              Sign In to Continue
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full font-semibold relative" 
              onClick={handleAccept} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accepting...
                </>
              ) : "Accept Invitation"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}