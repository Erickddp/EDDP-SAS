export type UserRole = "user" | "guest" | "admin";

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    googleAvatarUrl?: string | null;
    passwordHash: string;
    createdAt: Date;
}

export interface UserSession {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    googleAvatarUrl?: string | null;
}

// Temporary in-memory store for demo/development
// Will be replaced by PostgreSQL
const users: Map<string, User> = new Map();

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const user = Array.from(users.values()).find(u => u.email === email);
    return user;
}

export async function createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = Math.random().toString(36).substring(2, 15);
    const user: User = {
        ...data,
        id,
        createdAt: new Date(),
    };
    users.set(id, user);
    return user;
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    const user = users.get(userId);
    if (!user) return;
    users.set(userId, {
        ...user,
        avatarUrl,
    });
}
