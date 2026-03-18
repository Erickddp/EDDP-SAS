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
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error("[GOOGLE AUTH] Failed to get access token", tokens);
            throw new Error("Failed to get tokens");
        }

        // 2. Get user info from Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            throw new Error("Google user has no email");
        }

        // 3. Find or create user in our DB
        let user = await getUserByEmail(googleUser.email);

        if (!user) {
            user = await createUser({
                email: googleUser.email,
                name: googleUser.name || googleUser.given_name || "Usuario Google",
                passwordHash: "google-auth-node-pass", // Placeholder for social accounts
                avatarUrl: googleUser.picture || getRandomAvatar(googleUser.email),
                googleAvatarUrl: googleUser.picture || null,
                role: "user",
            });
        }

        // 4. Create local session
        await createSession({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            googleAvatarUrl: user.googleAvatarUrl ?? null,
            plan: user.plan || "gratis",
            subscriptionStatus: user.subscriptionStatus || "active",
        });

        console.log(`[GOOGLE AUTH] Success: ${user.email}`);

        // 5. Redirect to chat
        return NextResponse.redirect(new URL("/chat", request.url));

    } catch (error: any) {
        console.error("[GOOGLE AUTH] Error:", error.message);
        return NextResponse.redirect(new URL("/login?error=Internal auth error", request.url));
    }
}
