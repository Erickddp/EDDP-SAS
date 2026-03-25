import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    // Fail-fast Environment Validation
    const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000";
    
    // Skip static generation during build if secrets are missing
    if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
        return NextResponse.json({ url: `${APP_URL}/dashboard/billing` });
    }

    if (!STRIPE_SECRET_KEY) {
        console.error("[STRIPE CHECKOUT ERROR] Missing STRIPE_SECRET_KEY");
        return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY", code: "ENV_CONFIG_ERROR" }, { status: 400 });
    }

    if (!STRIPE_PRO_PRICE_ID) {
        console.error("[STRIPE CHECKOUT ERROR] Missing STRIPE_PRO_PRICE_ID");
        return NextResponse.json({ error: "Missing STRIPE_PRO_PRICE_ID", code: "ENV_CONFIG_ERROR" }, { status: 400 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        console.log(`[STRIPE CHECKOUT] Creating session for user: ${session.id} (${session.email})`);

        const stripeSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: STRIPE_PRO_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${APP_URL}/dashboard/billing?success=true`,
            cancel_url: `${APP_URL}/dashboard/billing?canceled=true`,
            client_reference_id: session.id,
            metadata: {
                userId: session.id,
            },
            customer_email: session.email,
        });

        if (!stripeSession.url) {
            throw new Error("Stripe did not return a checkout session URL");
        }

        return NextResponse.json({ url: stripeSession.url });
    } catch (error: any) {
        console.error('[STRIPE CHECKOUT ERROR]', error);
        return handleApiError(error, AppErrorType.INTERNAL);
    }
}
