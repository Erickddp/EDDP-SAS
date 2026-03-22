import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateSubscription } from "@/lib/user-storage";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (err: any) {
        console.error(`[STRIPE WEBHOOK] Verification failed: ${err.message}`);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    // Handle event types
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            const userId = session.client_reference_id || session.metadata?.userId;
            
            if (userId) {
                console.log(`[STRIPE WEBHOOK] Checkout completed for UserID=${userId}. Setting to PRO.`);
                await updateSubscription(userId, {
                    plan_type: "pro",
                    status: "active",
                    stripe_subscription_id: session.subscription as string,
                    current_period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) // 31 days buffer
                });
            }
            break;
        }
            
        case "invoice.payment_succeeded": {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string;
            
            // For recurring payments, update the period end
            if (subscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = (subscription.metadata as any).userId;
                
                if (userId) {
                    console.log(`[STRIPE WEBHOOK] Payment succeeded for UserID=${userId}. Renewing period.`);
                    await updateSubscription(userId, {
                        status: "active",
                        current_period_end: new Date((subscription as any).current_period_end * 1000)
                    });
                }
            }
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string;
            
            if (subscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = (subscription.metadata as any).userId;
                
                if (userId) {
                    console.warn(`[STRIPE WEBHOOK] Payment FAILED for UserID=${userId}. Marking as past_due.`);
                    await updateSubscription(userId, {
                        status: "past_due"
                    });
                }
            }
            break;
        }
            
        case "customer.subscription.deleted": {
            const subscription = event.data.object as any;
            const userId = subscription.metadata.userId;
            
            if (userId) {
                console.log(`[STRIPE WEBHOOK] Subscription DELETED for UserID=${userId}. Downgrading to gratis.`);
                await updateSubscription(userId, {
                    plan_type: "gratis",
                    status: "canceled",
                    current_period_end: new Date() // Expire immediately
                });
            }
            break;
        }
            
        default:
            console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
