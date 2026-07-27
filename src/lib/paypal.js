/**
 * PayPal service for order management.
 * Uses PayPal REST API v2 for order creation and capture.
 */

import config from "@/lib/config";

export const PayPalService = {
  /**
   * Get PayPal access token
   */
  async getAccessToken() {
    const { clientId, clientSecret, apiUrl } = config.paypal;

    if (!clientId || !clientSecret) {
      throw new Error("PayPal Client ID and Secret must be configured");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`PayPal auth failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return data.access_token;
  },

  /**
   * Create a PayPal order for a credit pack
   */
  async createOrder(planId) {
    const plan = config.getPlanConfig(planId);
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    const accessToken = await this.getAccessToken();
    const { apiUrl } = config.paypal;

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: planId,
          description: `${plan.name} - ${plan.credits} credits`,
          amount: {
            currency_code: "USD",
            value: (plan.price / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: config.appName,
        landing_page: "LOGIN",
        user_action: "PAY_NOW",
        return_url: `${config.paypal.returnUrl}/api/paypal/capture?planId=${planId}`,
        cancel_url: `${config.paypal.returnUrl}/pricing?canceled=true`,
      },
    };

    const res = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`PayPal order creation failed: ${res.status} ${errText}`);
    }

    const order = await res.json();
    console.log("[PAYPAL_DEBUG] Order response:", JSON.stringify(order).slice(0, 500));

    // Find the approval URL from the links
    const approvalLink = order.links?.find((l) => l.rel === "approve")?.href;
    if (!approvalLink) {
      throw new Error(`No approval URL in PayPal response. Links: ${JSON.stringify(order.links)}`);
    }

    return {
      orderId: order.id,
      approvalUrl: approvalLink,
      status: order.status,
    };
  },

  /**
   * Capture a PayPal order after user approval
   */
  async captureOrder(orderId) {
    const accessToken = await this.getAccessToken();
    const { apiUrl } = config.paypal;

    const res = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`PayPal capture failed: ${res.status} ${errText}`);
    }

    const capture = await res.json();

    // Check if capture was successful
    if (capture.status === "COMPLETED") {
      const purchaseUnit = capture.purchase_units?.[0];
      const payments = purchaseUnit?.payments?.captures?.[0];
      const planId = purchaseUnit?.reference_id;

      return {
        success: true,
        orderId: capture.id,
        status: capture.status,
        planId,
        payerEmail: capture.payer?.email_address,
        payerId: capture.payer?.payer_id,
        captureId: payments?.id,
        grossAmount: payments?.amount?.value,
      };
    }

    return {
      success: false,
      orderId: capture.id,
      status: capture.status,
    };
  },
};
