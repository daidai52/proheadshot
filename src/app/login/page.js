"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEnvelope, FaLock, FaKey, FaInfoCircle, FaArrowRight, FaUserPlus } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("callbackUrl") || searchParams.get("next") || "/";

  const [mode, setMode] = useState("login"); // "login" | "register" | "apikey"

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // API Key login
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push(next);
    }
  }, [status, router, next]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await signIn("login", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
        callbackUrl: next,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push(next);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regEmail || !regPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setRegLoading(false);
        return;
      }

      toast.success("Account created! Signing you in...");

      // Auto-login after registration
      const loginRes = await signIn("login", {
        email: regEmail,
        password: regPassword,
        redirect: false,
        callbackUrl: next,
      });

      if (loginRes?.ok) {
        router.push(next);
      } else {
        router.push("/login");
      }
    } catch (err) {
      toast.error("An error occurred during registration");
    } finally {
      setRegLoading(false);
    }
  };

  const handleApiKeyLogin = async (e) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key || key.length < 5) {
      toast.error("Please enter a valid API key");
      return;
    }

    setApiKeyLoading(true);
    try {
      const res = await signIn("apikey", {
        apiKey: key,
        redirect: false,
        callbackUrl: next,
      });

      if (res?.error) {
        toast.error(res.error || "Failed to sign in with API key");
      } else {
        toast.success("Signed in with API Key!");
        router.push(next);
      }
    } catch (err) {
      toast.error("An error occurred during API key authentication");
    } finally {
      setApiKeyLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-page px-6 text-primary-text select-none">
      <Toaster position="top-right" />
      <div className="relative bg-bg-card border border-divider w-full max-w-md rounded-xl p-8 space-y-6 shadow-2xl animate-scale-up">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl text-primary font-black shadow-md shadow-primary/15">
            📸
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "API Key Login"}
          </h2>
          <p className="text-xs font-semibold text-secondary-text leading-relaxed px-2">
            {mode === "login" && "Sign in to your account to generate AI headshots."}
            {mode === "register" && "Create a free account and get 10 credits to start."}
            {mode === "apikey" && "Use your MuAPI key to generate without using credits."}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-bg-page p-1 rounded-lg border border-divider/60">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-bg-card text-white shadow-sm border border-divider/40"
                : "text-secondary-text hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-bg-card text-white shadow-sm border border-divider/40"
                : "text-secondary-text hover:text-white"
            }`}
          >
            <FaUserPlus className="text-xs" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("apikey")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "apikey"
                ? "bg-bg-card text-white shadow-sm border border-divider/40"
                : "text-secondary-text hover:text-white"
            }`}
          >
            <FaKey className="text-xs" />
            <span>API Key</span>
          </button>
        </div>

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text text-xs" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-bg-page border border-divider rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text text-xs" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-bg-page border border-divider rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-secondary-text">
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-semibold cursor-pointer">
                Register here
              </button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                Name (optional)
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-bg-page border border-divider rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                Email *
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text text-xs" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-bg-page border border-divider rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                Password *
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text text-xs" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-bg-page border border-divider rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {regLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FaUserPlus className="text-xs" />
                  <span>Create Account (Free Credits)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-secondary-text">
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-semibold cursor-pointer">
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* API Key Form */}
        {mode === "apikey" && (
          <form onSubmit={handleApiKeyLogin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase font-bold text-secondary-text tracking-wider">
                MuAPI Key
              </label>
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your API key here"
                  className="w-full bg-bg-page border border-divider rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-secondary-text/50 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div className="flex justify-end">
                <a
                  href="https://muapi.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Get API Key from MuAPI →
                </a>
              </div>
            </div>
            <button
              type="submit"
              disabled={apiKeyLoading || !apiKeyInput.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {apiKeyLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FaKey className="text-xs" />
                  <span>Sign In with API Key</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-amber-400/80 font-medium">
              ⚡ No credit consumption when using your own API key
            </p>
          </form>
        )}

        <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/10 p-3.5 rounded text-[11px] leading-relaxed text-secondary-text">
          <FaInfoCircle className="text-primary text-xs shrink-0 mt-0.5" />
          <span>
            By signing in, you agree to our Terms of Service. Your password is encrypted and stored securely.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-bg-page text-primary-text">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
