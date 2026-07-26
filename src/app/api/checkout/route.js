import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

/**
 * POST /api/checkout
 * Legacy endpoint - redirects to PayPal create-order.
 * Kept for backwards compatibility.
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
    return NextResponse.json({ url: result.approvalUrl });
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
