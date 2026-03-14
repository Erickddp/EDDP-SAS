"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "./session";
import { getUserByEmail, createUser, updateUserAvatar } from "./user-storage";
import { getRandomAvatar, resolveEffectiveAvatar } from "./avatar-options";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contrase\u00f1a son requeridos" };
    }

    const user = await getUserByEmail(email);

    // In a real app we would verify the password hash using bcrypt
    if (!user || user.passwordHash !== password) {
        return { error: "Credenciales inv\u00e1lidas" };
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

    redirect("/chat");
}

export async function register(_prevState: { error?: string } | undefined, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Todos los campos son requeridos" };
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return { error: "El email ya est\u00e1 registrado" };
    }

    // In a real app we would hash the password
    const user = await createUser({
        name,
        email,
        avatarUrl: getRandomAvatar(email),
        googleAvatarUrl: null,
        passwordHash: password,
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
    });

    redirect("/chat");
}

export async function logout() {
    await deleteSession();
    redirect("/");
}
