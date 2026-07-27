/**
 * Centralized configuration for the SaaS template.
 * All environment variables are validated and exported from here.
 */

const PLANS = {
  basic: { id: "basic", name: "Basic Pack", price: 499, credits: 100, description: "Perfect for testing prompts and exploring styles.", popular: false },
  standard: { id: "standard", name: "Standard Pack", price: 999, credits: 250, description: "Ideal for regular creators wanting high resolution outputs.", popular: true },
  pro: { id: "pro", name: "Professional Pack", price: 1999, credits: 600, description: "Designed for power users demanding batch exports and high speed.", popular: false },
  business: { id: "business", name: "Business Pack", price: 4999, credits: 2000, description: "Maximum value for agency workflows and large volume generations.", popular: false }
};

const config = {
  appName: "ProHeadshot",
  theme: "midnight",
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    webhook_url: process.env.WEBHOOK_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  paypal: {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    email: process.env.PAYPAL_EMAIL,
    apiUrl: process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com",
    returnUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    plans: PLANS,
  },
  ai: {
    headshot: {
      apiKey: process.env.SILICONFLOW_API_KEY,
      endpoint: "https://api.siliconflow.cn/v1/images/generations",
      model: "Qwen/Qwen-Image",
    }
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  getPlanConfig(planId) {
    return PLANS[planId] || null;
  },
};

if (typeof window === "undefined") {
  const requiredKeys = [
    ["DATABASE_URL", config.db.url],
    ["SILICONFLOW_API_KEY", config.ai.headshot.apiKey],
  ];
  requiredKeys.forEach(([name, value]) => {
    if (!value) {
      console.warn(`[CONFIG] Warning: Missing critical environment variable: ${name}`);
    }
  });
}

export default config;
export { PLANS };
