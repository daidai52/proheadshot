import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

/**
 * POST /api/paypal/create-order
 * Creates a PayPal order for a credit pack purchase.
 * Returns the approval URL to redirect the user to PayPal.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const result = await BillingService.createPayPalOrder(session.user.id, planId);

    return NextResponse.json({
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      planId: result.planId,
      planCredits: result.planCredits,
    });
  } catch (error) {
    console.error("[PAYPAL_CREATE_ORDER]", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
