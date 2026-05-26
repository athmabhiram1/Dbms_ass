"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setError("");
    try {
      // Redirects to backend Google OAuth endpoint
      // Backend should handle callback and set session cookie, then redirect to /dashboard
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api/auth/google`;
    } catch {
      setError("OAuth redirect failed. Check your backend is running.");
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    // Dev-only: skip auth and go straight to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-container flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" fill="white" fillOpacity="0.2"/>
                <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 11.5L11 13.5L15 9.5" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CustodyCore</h1>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 mt-0.5">Forensic Management</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Chain of custody,<br />locked down tight.
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Secure evidence management for law enforcement. Every transfer logged, every lab result tracked, every disclosure audited.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: "inventory_2",  text: "End-to-end evidence tracking" },
            { icon: "history_edu",  text: "Immutable audit trail" },
            { icon: "science",      text: "Lab test management" },
            { icon: "auto_awesome", text: "AI-powered case summaries" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[15px] text-white/80">{icon}</span>
              </div>
              <span className="text-sm text-white/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — sign in */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" fill="#bec6e0" fillOpacity="0.25"/>
                <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" stroke="#bec6e0" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 11.5L11 13.5L15 9.5" stroke="#0051d5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-on-surface">CustodyCore</h1>
              <p className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">Forensic Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">Sign in</h2>
          <p className="text-sm text-on-surface-variant mb-8">Access your forensic management workspace</p>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogleOAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-60 mb-4"
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Dev bypass */}
          <button
            onClick={handleDevBypass}
            className="w-full flex items-center justify-center gap-2 bg-surface-container rounded-xl px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant"
          >
            <span className="material-symbols-outlined text-[16px]">developer_mode</span>
            Skip login (dev mode)
          </button>

          {error && (
            <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <p className="text-center text-xs text-on-surface-variant mt-8">
            Backend OAuth endpoint:{" "}
            <code className="bg-surface-container px-1.5 py-0.5 rounded text-secondary">
              /api/auth/google
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
