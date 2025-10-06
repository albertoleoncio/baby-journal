import { getServerSession } from "next-auth/next";
import AzureADProvider from "next-auth/providers/azure-ad";

// Scopes: offline_access for refresh tokens, Files.ReadWrite for OneDrive write access, plus basic OIDC scopes
const scopes = ["openid", "profile", "email", "offline_access", "Files.ReadWrite"].join(" ");

type MicrosoftToken = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sub?: string;
  error?: "RefreshAccessTokenError";
  [key: string]: unknown;
};

async function refreshMicrosoftAccessToken(token: MicrosoftToken) {
  try {
    const params = new URLSearchParams();
  params.set("client_id", process.env.AUTH_MICROSOFT_ID || "");
  params.set("client_secret", process.env.AUTH_MICROSOFT_SECRET || "");
    params.set("grant_type", "refresh_token");
  params.set("refresh_token", token.refreshToken || "");
    params.set("scope", scopes);

    const res = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to refresh token: ${res.status}`);
    }

  const refreshed: any = await res.json();
    const newExpiresAt = Date.now() + (refreshed.expires_in as number) * 1000 - 60_000; // 1 min early

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: newExpiresAt,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (err) {
    console.error("refreshMicrosoftAccessToken error", err);
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AUTH_MICROSOFT_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_SECRET!,
      authorization: { params: { scope: scopes } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }: any) {
      const t = token as MicrosoftToken;
      // Initial sign in
      if (account) {
        const expiresAt = Date.now() + ((account.expires_in as number) ?? 3600) * 1000 - 60_000;
        t.accessToken = (account as any).access_token;
        t.refreshToken = (account as any).refresh_token;
        t.sub = t.sub ?? (profile as any)?.sub ?? t.sub;
        t.expiresAt = expiresAt;
        return t;
      }

      if (t.expiresAt && Date.now() < t.expiresAt) {
        return t;
      }

      if (t.refreshToken) {
        return await refreshMicrosoftAccessToken(t);
      }
      return t;
    },
    async session({ session, token }: any) {
      const t = token as MicrosoftToken;
      (session as any).accessToken = t.accessToken;
      (session as any).userId = t.sub;
      return session;
    },
  },
};

export async function auth() { return getServerSession(authOptions as any); }

// No default export here; see app/api/auth/[...nextauth]/route.ts for handlers
