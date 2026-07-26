import { PayPalService } from "@/lib/paypal";
import config from "@/lib/config";
import { UserService } from "./user";

/**
 * Billing service managing credit purchases through PayPal.
 * Handles order creation, payment capture, and credit assignment.
 */
export const BillingService = {
  /**
   * Create a PayPal order for a credit pack purchase.
   * Returns the approval URL to redirect the user to PayPal.
   */
  async createPayPalOrder(userId, planId) {
    const plan = config.getPlanConfig(planId);
    if (!plan) throw new Error("Invalid plan selected");

    // Store the userId in the order context so we can look it up on return
    const result = await PayPalService.createOrder(planId);

    // We store the userId-to-order mapping in a simple way:
    // Append userId as a custom query param to the return URL
    // On return capture, we'll read it from the stored token
    return {
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      planId,
      planCredits: plan.credits,
    };
  },

  /**
   * Complete a PayPal order after user approval.
   * Captures the payment and credits the user.
   */
  async completePurchase(orderId, userId, planId) {
    const result = await PayPalService.captureOrder(orderId);

    if (result.success) {
      const plan = config.getPlanConfig(planId);
      if (plan && userId) {
        await UserService.addCredits(userId, plan.credits);
        return { success: true, userId, credits: plan.credits, captureId: result.captureId };
      }
    }

    return { success: false };
  },

  /**
   * Handle PayPal webhook/IPN events for post-payment processing.
   * Used as a backup when the return-url capture fails.
   */
  async handleWebhook(eventBody) {
    try {
      const event = typeof eventBody === "string" ? JSON.parse(eventBody) : eventBody;
      const eventType = event.event_type;

      // Listen for PAYMENT.CAPTURE.COMPLETED
      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        const resource = event.resource;
        const customId = resource.custom_id;
        const invoiceId = resource.invoice_id;

        if (customId) {
          // Parse custom_id format: "userId:planId:credits"
          const parts = customId.split(":");
          if (parts.length >= 3) {
            const userId = parts[0];
            const credits = parseInt(parts[2], 10);
            if (userId && credits > 0) {
              await UserService.addCredits(userId, credits);
              return { success: true, userId, credits };
            }
          }
        }
      }

      return { success: false };
    } catch (error) {
      console.error("[PAYPAL_WEBHOOK]", error);
      return { success: false };
    }
  },
};
