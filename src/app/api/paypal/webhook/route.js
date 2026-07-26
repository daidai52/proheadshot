import { NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing";

/**
 * POST /api/paypal/webhook
 * PayPal sends webhook events here for asynchronous payment notifications.
 * This is the primary mechanism for credit assignment in production.
 */
export async function POST(req) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // Verify the webhook signature (in production, verify with PayPal)
    // For MVP, we rely on PayPal's webhook URL verification

    const result = await BillingService.handleWebhook(event);

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYPAL_WEBHOOK]", error);
    // Still return 200 to prevent PayPal from retrying malformed events
    return NextResponse.json({ received: true });
  }
}
