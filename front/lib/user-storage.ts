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
        subscriptionStatus: subscription?.status || "none",
        createdAt: u.created_at
    };
}

export async function createUser(data: Omit<User, "id" | "createdAt" | "plan" | "subscriptionStatus">): Promise<User> {
    const client = await getClient();
    try {
        await client.query("BEGIN");
        
        const { rows } = await client.query(
            `INSERT INTO users (email, name, password_hash, avatar_url, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [data.email, data.name, data.passwordHash, data.avatarUrl, data.role]
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

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => (data as any)[f]);

    await query(
        `UPDATE subscriptions SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
        [userId, ...values]
    );
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    await query(
        `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
        [avatarUrl, userId]
    );
}
