import { query } from "./db";
import { PLAN_LIMITS, GUEST_LIMIT, PlanType } from "./saas-constants";

export async function checkUsageLimit(userId: string, plan: PlanType, isGuest: boolean): Promise<{ allowed: boolean; remaining: number; total: number }> {
    if (isGuest) {
        // For pure guests (no userId in DB yet), we might track by IP in a real app
        // For now, let's assume if they have a guest session, they are limited
        return { allowed: true, remaining: GUEST_LIMIT, total: GUEST_LIMIT };
    }

    try {
        // 1. Get current month counter
        const { rows } = await query(
            `SELECT current_month_count FROM user_usage_counters WHERE user_id = $1`,
            [userId]
        );

        const currentCount = rows.length > 0 ? rows[0].current_month_count : 0;
        const limit = PLAN_LIMITS[plan].maxQueriesPerMonth;

        return {
            allowed: currentCount < limit,
            remaining: Math.max(0, limit - currentCount),
            total: limit
        };
    } catch (error) {
        console.error("Error checking usage limit:", error);
        return { allowed: true, remaining: 0, total: 0 }; // Fallback to allow if DB fails
    }
}

export async function incrementUsage(userId: string | undefined): Promise<void> {
    if (!userId || userId.startsWith('guest-')) return;

    try {
        await query(
            `INSERT INTO user_usage_counters (user_id, current_month_count)
             VALUES ($1, 1)
             ON CONFLICT (user_id) 
             DO UPDATE SET current_month_count = user_usage_counters.current_month_count + 1,
                           last_reset_date = CASE 
                             WHEN user_usage_counters.last_reset_date < date_trunc('day', NOW()) THEN NOW()
                             ELSE user_usage_counters.last_reset_date
                           END,
                           current_month_count = CASE
                             WHEN user_usage_counters.last_reset_date < date_trunc('day', NOW()) THEN 1
                             ELSE user_usage_counters.current_month_count + 1
                           END`,
            [userId]
        );
    } catch (error) {
        console.error("Error incrementing usage:", error);
    }
}
