import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const PAYPAL_CLIENT_ID = "BAA5dISbGBTQz1l2qvNR2qRfbaLRI1dmYbB_DIjOBXb88gLWACggzgR4zfzMdyw_01tzhv6eGrNNatfnxc";
const PAYPAL_SECRET = "EKbYMoLKN1r5sqKugjlODiMLwLvrR7S3on_j4ET_AElcj6jfHTJjg7zA72NIu9bxxiicLTY9V05Iu-gR";
const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("token");
    const planId = searchParams.get("planId");

    if (!orderId) {
      return NextResponse.redirect(new URL("/pricing?error=missing_order", req.url));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=/api/paypal/capture?token=${orderId}${planId ? `&planId=${planId}` : ""}`, req.url)
      );
    }

    const token = await getPayPalToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });

    if (!captureRes.ok) {
      return NextResponse.redirect(new URL("/pricing?error=capture_failed", req.url));
    }

    const capture = await captureRes.json();

    // Get plan info from reference_id or query param
    const actualPlanId = planId || capture.purchase_units?.[0]?.reference_id || "basic";

    // Import at the top, but this is a workaround
    const { default: config } = await import("@/lib/config");
    const { UserService } = await import("@/lib/services/user");
    const plan = config.getPlanConfig(actualPlanId);

    if (capture.status === "COMPLETED" && plan && session.user.id) {
      await UserService.addCredits(session.user.id, plan.credits);
      return NextResponse.redirect(
        new URL(`/pricing?success=true&credits=${plan.credits}`, req.url)
      );
    }

    return NextResponse.redirect(new URL("/pricing?error=capture_failed", req.url));
  } catch (error) {
    console.error("[PAYPAL_CAPTURE]", error);
    return NextResponse.redirect(new URL("/pricing?error=server_error", req.url));
  }
}
