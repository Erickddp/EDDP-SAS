"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "./session";
import { getUserByEmail, createUser, updateUserAvatar } from "./user-storage";
import { getRandomAvatar, resolveEffectiveAvatar } from "./avatar-options";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Hash a password using scrypt
 */
function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const key = scryptSync(password, salt, 64);
    const hashBuffer = Buffer.from(hash, "hex");
    return timingSafeEqual(key, hashBuffer);
}

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son requeridos" };
    }

    try {
        const user = await getUserByEmail(email);

        if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
            console.warn(`[AUTH] Failed login attempt for: ${email}`);
            return { error: "Credenciales inválidas" };
        }

        const resolvedAvatar = resolveEffectiveAvatar({
            avatarUrl: user.avatarUrl,
            googleAvatarUrl: user.googleAvatarUrl,
            seed: user.id,
        });

        if (!user.avatarUrl && !user.googleAvatarUrl) {
            await updateUserAvatar(user.id, resolvedAvatar);
        }

        await createSession({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: resolvedAvatar,
            googleAvatarUrl: user.googleAvatarUrl ?? null,
            plan: user.plan || "gratis",
            subscriptionStatus: user.subscriptionStatus || "active",
        });

        console.log(`[AUTH] User login successful: ${user.id} (${user.email})`);
    } catch (error: any) {
        console.error(`[AUTH] Login error:`, error.message);
        return { error: "Error interno durante el inicio de sesión" };
    }

    redirect("/chat");
}

export async function register(_prevState: { error?: string } | undefined, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Todos los campos son requeridos" };
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return { error: "El email ya está registrado" };
        }

        // Securely hash the password
        const user = await createUser({
            name,
            email,
            avatarUrl: getRandomAvatar(email),
            googleAvatarUrl: null,
            passwordHash: hashPassword(password),
            role: "user",
        });

        await createSession({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            googleAvatarUrl: user.googleAvatarUrl ?? null,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
        });

        console.log(`[AUTH] New user registered: ${user.id} (${user.email})`);
    } catch (error: any) {
        console.error(`[AUTH] Registration error:`, error.message);
        return { error: "Error interno durante el registro" };
    }

    redirect("/chat");
}

export async function guestLogin() {
    const guestId = "guest-" + Math.random().toString(36).substring(2, 11);
    const avatarUrl = getRandomAvatar(guestId);

    await createSession({
        id: guestId,
        email: `invitado_${guestId}@demo.local`,
        name: "Invitado",
        role: "guest",
        avatarUrl,
        googleAvatarUrl: null,
        plan: "gratis",
        subscriptionStatus: "active",
        questionCount: 0, // Phase 8: Start counter
    });

    redirect("/chat");
}

export async function googleLogin() {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    
    const options = {
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    const qs = new URLSearchParams(options);
    const url = `${rootUrl}?${qs.toString()}`;
    
    redirect(url);
}

export async function googleSimulatedLogin() {
    // Phase 8: Google Auth Simulation (Backup/Legacy)
    const mockGoogleId = "google-" + Math.random().toString(36).substring(2, 11);
    
    await createSession({
        id: mockGoogleId,
        email: `user_${mockGoogleId}@gmail.com`,
        name: "Usuario Google",
        role: "user",
        avatarUrl: "/avatars/avatar-ocean.svg",
        googleAvatarUrl: "/avatars/avatar-ocean.svg",
        plan: "gratis",
        subscriptionStatus: "active",
    });

    redirect("/chat");
}

export async function logout() {
    await deleteSession();
    redirect("/");
}
