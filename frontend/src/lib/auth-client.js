import { createAuthClient } from "better-auth/react";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000", // Update with your backend URL
  plugins: [
    emailOTPClient(),
    organizationClient(),
  ],
});

export const { useSession, useOrganization, useActiveOrganization, signIn, signOut } = authClient;
