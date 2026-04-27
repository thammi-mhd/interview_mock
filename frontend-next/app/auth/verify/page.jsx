"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [resending, setResending] = useState(false);
  const MAX_RESENDS = 3;

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email });
      setStep(2);
      setCountdown(30);
      setResendCount(0);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount >= MAX_RESENDS || countdown > 0 || resending) return;
    
    setError("");
    setResending(true);
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email });
      setResendCount(prev => prev + 1);
      setCountdown(30 * (resendCount + 1)); // Increase wait time with each resend
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      router.push("/auth/login?verified=true");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP");
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
          {step === 1 ? "Verify your email" : "Enter your OTP"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted2">
          {step === 1
            ? "Enter your registered email to receive a verification code."
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
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
                    placeholder="Enter your email"
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
                      Send OTP <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted2 mb-2 text-center">
                  6-Digit OTP
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="input-field tracking-[0.5em] text-center text-lg"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
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
                      Verify Email <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
              <div className="mt-6 flex flex-col items-center gap-3">
                {resendCount < MAX_RESENDS ? (
                  <button
                    type="button"
                    disabled={countdown > 0 || resending}
                    onClick={handleResendOtp}
                    className={`text-sm font-medium transition-colors ${
                      countdown > 0 || resending
                        ? "text-muted2 cursor-not-allowed"
                        : "text-accent hover:text-accent/80"
                    }`}
                  >
                    {resending
                      ? "Sending..."
                      : countdown > 0
                      ? `Resend OTP in ${countdown}s`
                      : "Resend OTP"}
                  </button>
                ) : (
                  <span className="text-sm text-red-400">
                    Maximum resend attempts reached.
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-muted2 hover:text-text transition-colors"
                >
                  ← Use different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
