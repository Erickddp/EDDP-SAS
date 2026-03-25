export type PlanType = 'gratis' | 'basic' | 'pro' | 'despacho';

export interface PlanLimits {
    maxQueriesPerMonth: number;
    canExport: boolean;
    canUseAdvancedRAG: boolean;
    multiUser: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    gratis: {
        maxQueriesPerMonth: 3, // Actually daily limit with the new date_trunc('day')
        canExport: false,
        canUseAdvancedRAG: false,
        multiUser: false,
    },
    basic: {
        maxQueriesPerMonth: 50,
        canExport: true,
        canUseAdvancedRAG: true,
        multiUser: false,
    },
    pro: {
        maxQueriesPerMonth: 150, // High capacity daily rate limit
        canExport: true,
        canUseAdvancedRAG: true,
        multiUser: false,
    },
    despacho: {
        maxQueriesPerMonth: 2500,
        canExport: true,
        canUseAdvancedRAG: true,
        multiUser: true,
    },
};

export const GUEST_LIMIT = 5;
