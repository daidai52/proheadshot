import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

const PAYPAL_CLIENT_ID = "BAA5dISbGBTQz1l2qvNR2qRfbaLRI1dmYbB_DIjOBXb88gLWACggzgR4zfzMdyw_01tzhv6eGrNNatfnxc";
const PAYPAL_SECRET = "EKbYMoLKN1r5sqKugjlODiMLwLvrR7S3on_j4ET_AElcj6jfHTJjg7zA72NIu9bxxiicLTY9V05Iu-gR";
const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * POST /api/paypal/create-order
 * Creates a PayPal order and returns approval URL
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

    const { default: config } = await import("@/lib/config");
    const plan = config.getPlanConfig(planId);
    if (!plan) throw new Error("Invalid plan");

    const token = await getPayPalToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: planId,
          description: `${plan.name} - ${plan.credits} credits`,
          amount: {
            currency_code: "USD",
            value: (plan.price / 100).toFixed(2),
          },
        }],
        application_context: {
          brand_name: "ProHeadshot",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${config.auth.url}/api/paypal/capture?planId=${planId}`,
          cancel_url: `${config.auth.url}/pricing?canceled=true`,
        },
      }),
    });

    if (!orderRes.ok) {
      const txt = await orderRes.text();
      throw new Error(`PayPal order failed: ${orderRes.status} ${txt}`);
    }

    const order = await orderRes.json();
    const approveLink = order.links?.find((l) => l.rel === "approve")?.href;

    if (!approveLink) {
      console.error("[PAYPAL_DEBUG] Full response:", JSON.stringify(order));
      throw new Error("No approval URL. Response: " + JSON.stringify(order).slice(0, 300));
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approveLink,
      planId,
      planCredits: plan.credits,
    });
  } catch (error) {
    console.error("[PAYPAL_CREATE_ORDER]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
