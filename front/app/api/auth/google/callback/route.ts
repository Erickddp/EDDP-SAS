import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { getUserByEmail, createUser } from "@/lib/user-storage";
import { getRandomAvatar } from "@/lib/avatar-options";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=Google auth failed", request.url));
    }

    try {
        // 1. Exchange code for tokens
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const redirectUri = `${origin}/api/auth/google/callback`;

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error("[GOOGLE AUTH] Failed to get tokens:", tokens);
            const errorMsg = tokens.error_description || tokens.error || "Token exchange failed";
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url));
        }

        // 2. Get user info from Google (Metadata)
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            console.error("[GOOGLE AUTH] No email in profile:", googleUser);
            throw new Error("Google profile has no email associated.");
        }

        // 3. OPTIMIZATION: Extract user_metadata directly and build session
        // This follows the 'Directiva del Fundador': session doesn't wait for DB.
        const name = googleUser.name || googleUser.given_name || "Usuario Google";
        const avatar = googleUser.picture || getRandomAvatar(googleUser.email);
        
        const initialSessionData = {
            id: googleUser.id, // Temporary ID fallback to Google Subject ID
            email: googleUser.email,
            name: name,
            role: "user" as const,
            avatarUrl: avatar,
            googleAvatarUrl: googleUser.picture || null,
            plan: "gratis" as const, // Default, background sync will verify
            professionalProfile: null,
            subscriptionStatus: "active" as const,
        };

        // 4. Create Session IMMEDIATELY
        await createSession(initialSessionData);

        // 5. ASYNC SYNC: Sync user to DB in the background without blocking the redirect
        // This resolves the 'ENOTFOUND' bottleneck in production callback.
        (async () => {
            try {
                console.log(`[AUTH BACKGROUND] Starting sync for ${googleUser.email}`);
                let userRecord = await getUserByEmail(googleUser.email);

                if (!userRecord) {
                    userRecord = await createUser({
                        email: googleUser.email,
                        name: name,
                        passwordHash: "google-social-auth",
                        avatarUrl: avatar,
                        googleAvatarUrl: googleUser.picture || null,
                        role: "user",
                    });
                    console.log(`[AUTH BACKGROUND] New user created in DB: ${userRecord.email}`);
                } else {
                    console.log(`[AUTH BACKGROUND] Existing user synced: ${userRecord.email}`);
                }

                // If DB record has different data (plan, id), it will be picked up on next page refresh 
                // or we could potentially update the session here if the environment allows.
                // For now, the continuity is preserved by the Google data.
            } catch (bgError: any) {
                // Log but don't crash the already redirected user.
                console.error("[AUTH BACKGROUND_CRITICAL] Sync error (resolvability issue?):", bgError.message);
                // System remains functional because session was already granted.
            }
        })();

        console.log(`[GOOGLE AUTH] Success (Session redirected): ${googleUser.email}`);

        // 6. Redirect to chat immediately
        return NextResponse.redirect(new URL("/chat", request.url));

    } catch (error: any) {
        console.error("[GOOGLE AUTH] Critical callback error:", error.message);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
}
