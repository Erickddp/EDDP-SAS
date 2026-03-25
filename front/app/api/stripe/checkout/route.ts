import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        if (!STRIPE_PRO_PRICE_ID) {
            console.warn("Falta STRIPE_PRO_PRICE_ID en las variables de entorno.");
            return handleApiError(new Error("Configuración de pagos incompleta. Verifica STRIPE_PRO_PRICE_ID."), AppErrorType.INTERNAL);
        }

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
            client_reference_id: session.id, // ID del usuario para el webhook
            metadata: {
                userId: session.id,
            },
            customer_email: session.email,
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error: any) {
        return handleApiError(error, AppErrorType.INTERNAL);
    }
}
