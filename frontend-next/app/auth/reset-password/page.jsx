"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/auth/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>
      <div className="absolute w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-50px] left-1/2 -translate-x-1/2 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Home Button */}
      <div className="absolute top-4 right-4 z-20">
        <Link
          href="/"
          className="px-4 py-2 text-sm border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
        >
          ← Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-8"
        >
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="#06070a" />
              <rect
                x="11"
                y="2"
                width="7"
                height="7"
                rx="2"
                fill="#06070a"
                opacity=".5"
              />
              <rect
                x="2"
                y="11"
                width="7"
                height="7"
                rx="2"
                fill="#06070a"
                opacity=".4"
              />
              <rect
                x="11"
                y="11"
                width="7"
                height="7"
                rx="2"
                fill="#06070a"
                opacity=".25"
              />
            </svg>
          </div>
          <span className="font-bebas text-3xl tracking-wide text-text mt-1">
            Intervuo
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bebas tracking-wide text-text">
          {success ? "Password Reset!" : "Set new password"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <p className="text-muted2 text-sm">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </p>
              <Link
                href="/auth/login"
                className="w-full flex justify-center btn-primary"
              >
                Sign In <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted2 mb-2">
                  New password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input-field"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted2 mb-2">
                  Confirm password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input-field"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center btn-primary"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#06070a]" />
                  ) : (
                    <>
                      Reset Password <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
