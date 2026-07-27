"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { FaSignOutAlt } from "react-icons/fa";

export function LoginButton({ className }) {
  return (
    <Link
      href="/login"
      className={`bg-primary text-white px-5 py-1.5 rounded-full text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 ${className}`}
    >
      Sign In
    </Link>
  );
}

export function SignOutButton({ className }) {
  return (
    <button
      onClick={() => signOut()}
      className={`text-zinc-400 hover:text-white transition-colors ${className}`}
    >
      <FaSignOutAlt />
    </button>
  );
}
