"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("azure-ad", { callbackUrl: "/" });
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={loading}
      className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Connexion en cours…
        </span>
      ) : (
        <span className="flex items-center gap-3">
          <svg viewBox="0 0 23 23" className="h-5 w-5" fill="none">
            <rect x="1" y="1" width="10" height="10" fill="#f25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
            <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
            <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
          </svg>
          Se connecter avec Microsoft
        </span>
      )}
    </Button>
  );
}
