"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "./session";
import { getUserByEmail, createUser } from "./user-storage";
import type { UserRole } from "./user-storage";

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son requeridos" };
    }

    const user = await getUserByEmail(email);

    // In a real app we would verify the password hash using bcrypt
    if (!user || user.passwordHash !== password) {
        return { error: "Credenciales inválidas" };
    }

    await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    redirect("/chat");
}

export async function register(prevState: any, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Todos los campos son requeridos" };
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return { error: "El email ya está registrado" };
    }

    // In a real app we would hash the password
    const user = await createUser({
        name,
        email,
        passwordHash: password,
        role: "user",
    });

    await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    redirect("/chat");
}

export async function guestLogin() {
    const guestId = "guest-" + Math.random().toString(36).substring(2, 11);
    
    await createSession({
        id: guestId,
        email: `invitado_${guestId}@demo.local`,
        name: "Invitado",
        role: "guest",
    });

    redirect("/chat");
}

export async function logout() {
    await deleteSession();
    redirect("/");
}
