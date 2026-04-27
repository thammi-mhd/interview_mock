"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-muted2">
          {sent
            ? "Check your email for a reset link."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-muted2 text-sm">
                If an account exists with{" "}
                <span className="text-text font-medium">{email}</span>,
                you&apos;ll receive a password reset link shortly.
              </p>
              <Link
                href="/auth/login"
                className="w-full flex justify-center btn-primary"
              >
                <ArrowLeft size={18} /> Back to Login
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
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      Send Reset Link <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-muted2">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
