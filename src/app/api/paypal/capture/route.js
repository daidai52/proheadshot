import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

/**
 * GET /api/paypal/capture
 * PayPal redirects here after the user approves the payment.
 * We capture the order and credit the user.
 *
 * Query params: token (PayPal order ID), PayerID
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("token"); // PayPal uses "token" for order ID
    const payerId = searchParams.get("PayerID");

    if (!orderId) {
      return NextResponse.redirect(new URL("/pricing?error=missing_order", req.url));
    }

    // We need to figure out which user this order belongs to.
    // Since the user just came back from PayPal, we use their session.
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      // If session expired, redirect to login with the order info
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=/api/paypal/capture?token=${orderId}${payerId ? `&PayerID=${payerId}` : ""}`, req.url)
      );
    }

    // We need to know which plan was purchased.
    // The plan ID is stored in the order's purchase_units reference_id.
    // We can look it up, but for simplicity we use the user's last stored intent.
    // A more robust approach would store orderId → userId + planId mapping in DB.
    // For MVP: We'll store the plan ID in the session or retrieve it from the order details.

    // For now, let's look up the order details from PayPal to get the plan ID.
    const { PayPalService } = await import("@/lib/paypal");
    const orderDetails = await PayPalService.captureOrder(orderId);

    if (!orderDetails.success) {
      return NextResponse.redirect(new URL("/pricing?error=capture_failed", req.url));
    }

    // Complete the purchase using the planId from the captured order
    const result = await BillingService.completePurchase(
      orderId,
      session.user.id,
      orderDetails.planId
    );

    if (result.success) {
      return NextResponse.redirect(new URL(`/pricing?success=true&credits=${result.credits}`, req.url));
    }

    return NextResponse.redirect(new URL("/pricing?error=credit_failed", req.url));
  } catch (error) {
    console.error("[PAYPAL_CAPTURE]", error);
    return NextResponse.redirect(new URL("/pricing?error=server_error", req.url));
  }
}
