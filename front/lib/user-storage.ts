import crypto from "crypto";
import { PlanType } from "./saas-constants";

export type UserRole = "user" | "guest" | "admin";

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    googleAvatarUrl?: string | null;
    passwordHash: string;
    plan: PlanType;
    professionalProfile?: string | null;
    subscriptionStatus: "active" | "canceled" | "past_due" | "none";
    createdAt: Date;
}

import { query, getClient } from "./db";

// Will be replaced by PostgreSQL
// const users: Map<string, User> = new Map();

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    
    if (rows.length === 0) return undefined;
    
    const u = rows[0];
    // Get subscription plan
    const { rows: subRows } = await query(
        `SELECT plan_type, status, current_period_end, provider_subscription_id 
         FROM subscriptions WHERE user_id = $1 LIMIT 1`,
        [u.id]
    );

    const subscription = subRows[0];
    const now = new Date();
    const isPeriodValid = !subscription?.current_period_end || new Date(subscription.current_period_end) > now;
    const isStatusValid = subscription?.status === 'active' || subscription?.status === 'trialing';
    
    const isPlanActive = isStatusValid && isPeriodValid;

    return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatarUrl: u.avatar_url,
        passwordHash: u.password_hash,
        plan: isPlanActive ? (subscription?.plan_type || "gratis") : "gratis",
        professionalProfile: u.professional_profile || null,
        subscriptionStatus: subscription?.status || "none",
        createdAt: u.created_at
    };
}

export async function createUser(data: Omit<User, "id" | "createdAt" | "plan" | "subscriptionStatus">): Promise<User> {
    const client = await getClient();
    try {
        await client.query("BEGIN");
        
        // Ensure a valid UUID is generated in the backend (Phase 9B robustness)
        const userId = crypto.randomUUID();
        
        const { rows } = await client.query(
            `INSERT INTO users (id, email, name, password_hash, avatar_url, role, professional_profile)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [userId, data.email, data.name, data.passwordHash, data.avatarUrl, data.role, data.professionalProfile || null]
        );
        
        const user = rows[0];

        // Create initial subscription
        await client.query(
            `INSERT INTO subscriptions (user_id, plan_type, status)
             VALUES ($1, $2, $3)`,
            [user.id, "gratis", "active"]
        );

        // Create initial usage counter
        await client.query(
            `INSERT INTO user_usage_counters (user_id, current_month_count)
             VALUES ($1, 0)`,
            [user.id]
        );

        await client.query("COMMIT");

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatar_url,
            passwordHash: user.password_hash,
            plan: "gratis",
            professionalProfile: user.professional_profile || null,
            subscriptionStatus: "active",
            createdAt: user.created_at
        };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

export async function getUserById(id: string): Promise<User | undefined> {
    const { rows } = await query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );

    if (rows.length === 0) return undefined;

    const u = rows[0];
    const { rows: subRows } = await query(
        `SELECT plan_type, status, current_period_end 
         FROM subscriptions WHERE user_id = $1 LIMIT 1`,
        [u.id]
    );

    const subscription = subRows[0];
    const now = new Date();
    const isPeriodValid = !subscription?.current_period_end || new Date(subscription.current_period_end) > now;
    const isStatusValid = subscription?.status === 'active' || subscription?.status === 'trialing';
    const isPlanActive = isStatusValid && isPeriodValid;

    return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatarUrl: u.avatar_url,
        passwordHash: u.password_hash,
        plan: isPlanActive ? (subscription?.plan_type || "gratis") : "gratis",
        professionalProfile: u.professional_profile || null,
        subscriptionStatus: subscription?.status || "none",
        createdAt: u.created_at
    };
}

export async function getSubscriptionByUserId(userId: string) {
    const { rows } = await query(
        `SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

export async function updateSubscription(userId: string, data: Partial<{
    plan_type: string;
    status: string;
    current_period_start: Date;
    current_period_end: Date;
    provider: string;
    provider_subscription_id: string;
    stripe_subscription_id: string;
    updated_at: Date;
}>) {
    const fields = Object.keys(data);
    if (fields.length === 0) return;

    const { rows } = await query(`SELECT 1 FROM subscriptions WHERE user_id = $1`, [userId]);
    
    if (rows.length === 0) {
        const cols = ["user_id", ...fields].join(", ");
        const placeholders = ["$1", ...fields.map((_, i) => `$${i + 2}`)].join(", ");
        const values = [userId, ...fields.map(f => (data as Record<string, unknown>)[f])];
        await query(`INSERT INTO subscriptions (${cols}) VALUES (${placeholders})`, values);
    } else {
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
        const values = fields.map(f => (data as Record<string, unknown>)[f]);
        await query(
            `UPDATE subscriptions SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
            [userId, ...values]
        );
    }
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    await query(
        `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
        [avatarUrl, userId]
    );
}

export async function updateUserProfile(userId: string, data: { name?: string; professionalProfile?: string | null }): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;

    const setClause = fields.map((f, i) => {
        const dbField = f === "professionalProfile" ? "professional_profile" : (f === "avatarUrl" ? "avatar_url" : f);
        return `${dbField} = $${i + 2}`;
    }).join(", ");
    const values = fields.map(f => (data as Record<string, unknown>)[f]);

    await query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        [userId, ...values]
    );
}

export interface UserPreferences {
    expertiseLevel: string;
    preferredTone: string;
    industryContext: string | null;
    additionalContext: string | null;
    isProfileComplete: boolean;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { rows } = await query(
        `SELECT expertise_level, preferred_tone, industry_context, additional_context, is_profile_complete 
         FROM user_preferences WHERE user_id = $1`,
        [userId]
    );
    
    if (rows.length === 0) return null;
    
    const r = rows[0];
    return {
        expertiseLevel: r.expertise_level,
        preferredTone: r.preferred_tone,
        industryContext: r.industry_context,
        additionalContext: r.additional_context,
        isProfileComplete: r.is_profile_complete
    };
}

export async function updateUserPreferences(userId: string, data: Partial<UserPreferences>): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;

    // Map camelCase to snake_case
    const mapping: Record<string, string> = {
        expertiseLevel: "expertise_level",
        preferredTone: "preferred_tone",
        industryContext: "industry_context",
        additionalContext: "additional_context",
        isProfileComplete: "is_profile_complete"
    };

    const setClause = fields.map((f, i) => `${mapping[f] || f} = $${i + 2}`).join(", ");
    const values = fields.map(f => (data as any)[f]);

    await query(
        `INSERT INTO user_preferences (user_id, ${fields.map(f => mapping[f] || f).join(", ")})
         VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(", ")})
         ON CONFLICT (user_id) DO UPDATE SET ${setClause}, updated_at = NOW()`,
        [userId, ...values]
    );
}
