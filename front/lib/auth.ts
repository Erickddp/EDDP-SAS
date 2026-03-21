import { query } from "./db";
import { UserSession, createSession, deleteSession } from "./session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(email: string, name: string, password?: string) {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    
    try {
        const { rows } = await query(
            `INSERT INTO users (email, name, password_hash, role)
             VALUES ($1, $2, $3, 'user')
             RETURNING id, email, name, role`,
            [email.toLowerCase(), name, passwordHash]
        );

        const user = rows[0];
        
        // Initialize usage counter
        await query(
            `INSERT INTO user_usage_counters (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [user.id]
        );

        return user;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
}

export async function loginUser(email: string, password?: string) {
    const { rows } = await query(
        `SELECT id, email, name, password_hash, role FROM users WHERE email = $1`,
        [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user) return null;

    if (password && user.password_hash) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;
    }

    // Prepare session data
    const sessionData: UserSession = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "user" | "admin",
        plan: "gratis",
        subscriptionStatus: "active" // Default for now
    };

    await createSession(sessionData);
    return user;
}

export async function logout() {
    await deleteSession();
}

/**
 * SERVER ACTIONS (Phase 4 UI compatibility)
 */

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son requeridos" };
    }

    try {
        const user = await loginUser(email, password);
        if (!user) {
            return { error: "Credenciales inválidas" };
        }
    } catch (error) {
        return { error: "Error interno al iniciar sesión" };
    }
    
    redirect("/chat");
}

export async function register(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !name || !password) {
        return { error: "Todos los campos son obligatorios" };
    }

    try {
        await registerUser(email, name, password);
        // After registration, auto-login
        await loginUser(email, password);
    } catch (error: any) {
        if (error.code === '23505') {
            return { error: "El correo ya está registrado" };
        }
        return { error: "Error al crear la cuenta" };
    }

    redirect("/chat");
}

export async function googleLogin() {
    // Phase 4: Placeholder for real Google Auth redirect
    // Eventually: redirect(googleAuthUrl)
    console.log("Google Auth requested - Redirecting to chat (Mock)");
    redirect("/chat");
}

export async function guestLogin() {
    // Phase 4: Guests are recorded with NULL UUIDs in usage_logs
    // but they still need a session ID to track their 2-question limit
    const guestSession: UserSession = {
        id: `guest-${Math.random().toString(36).substring(2, 11)}`,
        email: "guest@myfiscal.io",
        name: "Invitado",
        role: "guest",
        plan: "gratis",
        subscriptionStatus: "none",
        questionCount: 0
    };
    
    await createSession(guestSession);
    redirect("/chat");
}
