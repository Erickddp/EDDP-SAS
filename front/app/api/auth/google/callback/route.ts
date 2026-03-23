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

        // 3. DATABASE SYNC & UUID RESOLUTION
        // Extract metadata for potential new user creation
        const name: string = googleUser.name || googleUser.given_name || "Usuario Google";
        const avatar = googleUser.picture || getRandomAvatar(googleUser.email);

        // To resolve "invalid input syntax for type uuid", we must use the DB UUID, not the Google ID.
        let userRecord = null;
        try {
            userRecord = await getUserByEmail(googleUser.email);

            if (!userRecord) {
                userRecord = await createUser({
                    email: googleUser.email,
                    name: name,
                    passwordHash: "google-social-auth",
                    avatarUrl: avatar,
                    googleAvatarUrl: googleUser.picture || null,
                    role: "user",
                });
                console.log(`[GOOGLE AUTH] New user created: ${userRecord.email} (${userRecord.id})`);
            }
        } catch (dbError: any) {
            console.error("[GOOGLE AUTH] Database sync failed during login:", dbError.message);
            // If the database is down, we cannot proceed with a persistent UUID session.
            return NextResponse.redirect(new URL("/login?error=Base de datos no disponible", request.url));
        }

        if (!userRecord) {
            return NextResponse.redirect(new URL("/login?error=Usuario no encontrado", request.url));
        }

        // 4. Create Session with Database UUID
        // This solves the 'invalid input syntax for type uuid' error.
        const sessionData = {
            id: userRecord.id, // Now using the real UUID
            email: userRecord.email,
            name: userRecord.name || name,
            role: userRecord.role || "user",
            avatarUrl: userRecord.avatarUrl || avatar,
            googleAvatarUrl: userRecord.googleAvatarUrl || googleUser.picture || null,
            plan: userRecord.plan || "gratis",
            professionalProfile: userRecord.professionalProfile || null,
            subscriptionStatus: userRecord.subscriptionStatus || "active",
        };

        await createSession(sessionData);

        console.log(`[GOOGLE AUTH] Success: ${userRecord.email} | Session ID: ${userRecord.id}`);

        // 5. Redirect to chat
        return NextResponse.redirect(new URL("/chat", request.url));

    } catch (error: any) {
        console.error("[GOOGLE AUTH] Critical callback error:", error.message);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
}
