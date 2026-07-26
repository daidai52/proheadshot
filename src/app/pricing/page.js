"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { FaCheck, FaInfoCircle, FaPaypal } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const PLANS = [
  { id: "basic", name: "Basic Pack", price: "$4.99", credits: 100, description: "Perfect for testing prompts and exploring styles." },
  { id: "standard", name: "Standard Pack", price: "$9.99", credits: 250, description: "Ideal for regular creators wanting high resolution outputs.", popular: true },
  { id: "pro", name: "Professional Pack", price: "$19.99", credits: 600, description: "Designed for power users demanding batch exports and high speed." },
  { id: "business", name: "Business Pack", price: "$49.99", credits: 2000, description: "Maximum value for agency workflows and large volume generations." }
];

function PricingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null);

  // Handle redirect back from PayPal
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const credits = searchParams.get("credits");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success(credits ? `Payment successful! +${credits} credits added.` : "Payment successful! Credits added.");
      // Clean URL
      router.replace("/pricing");
    } else if (canceled === "true") {
      toast.error("Payment was canceled.");
      router.replace("/pricing");
    } else if (error) {
      const messages = {
        missing_order: "Missing order information from PayPal.",
        capture_failed: "Payment capture failed. Please try again.",
        credit_failed: "Payment succeeded but credit assignment failed. Contact support.",
        server_error: "A server error occurred. Please try again.",
      };
      toast.error(messages[error] || "An error occurred during checkout.");
      router.replace("/pricing");
    }
  }, [searchParams, router]);

  const handleCheckout = async (planId) => {
    if (status !== "authenticated") {
      toast.error("Please sign in first to purchase credits.");
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data } = await axios.post("/api/paypal/create-order", { planId });
      if (data.approvalUrl) {
        // Store order info in sessionStorage so we can verify on return
        sessionStorage.setItem("pendingPayPalOrder", JSON.stringify({
          orderId: data.orderId,
          planId: data.planId,
          planCredits: data.planCredits,
        }));
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("No approval URL returned");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create PayPal order.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page select-none text-primary-text overflow-hidden">
      <Toaster position="top-right" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col gap-10 overflow-y-auto scrollbar-subtle items-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-1">
            <FaInfoCircle className="text-primary text-xs" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Pricing Plans</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Buy Credit Packs</h1>
          <p className="text-xs sm:text-sm text-secondary-text max-w-lg leading-relaxed">
            Purchase flexible credit packages to generate AI headshots. Pay once, use anytime — no subscription required.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-bg-card border rounded-lg p-6 flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                plan.popular ? "border-primary shadow-xl shadow-primary/5 scale-105" : "border-divider/50 shadow-md"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary-text">{plan.name}</h3>
                  <p className="text-2xl font-black tracking-tight text-white">{plan.price}</p>
                </div>

                <div className="text-xs bg-bg-page/50 border border-divider/30 p-3 rounded text-center font-extrabold text-primary">
                  {plan.credits} Credits
                </div>

                <p className="text-xs text-secondary-text leading-relaxed font-medium min-h-[3rem]">{plan.description}</p>

                <ul className="space-y-2 border-t border-divider/30 pt-4 text-xs font-semibold text-secondary-text">
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-primary text-[10px]" />
                    <span>Multiple style categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-primary text-[10px]" />
                    <span>HD image downloads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-primary text-[10px]" />
                    <span>No subscription required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-primary text-[10px]" />
                    <span>PayPal secure checkout</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer select-none active:scale-[0.98] flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-[#0070ba] text-white hover:bg-[#003087] shadow-primary/15"
                    : "bg-bg-page hover:bg-bg-card text-primary-text border border-divider"
                }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaPaypal className="text-sm" />
                    <span>Pay with PayPal</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center text-[10px] text-secondary-text font-medium max-w-md">
          <p>All transactions are processed securely via PayPal. Your credits are added instantly after payment confirmation.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Pricing() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-bg-page text-primary-text">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
