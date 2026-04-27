"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });

      // OTP is sent via email, switch to OTP verification view
      setIsOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp,
      });

      // Now automatically login or redirect to login
      router.push("/auth/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setResendSuccess(false);
    setResendLoading(true);

    try {
      await axios.post(`${API_URL}/auth/resend-otp`, {
        email,
      });

      setResendSuccess(true);
      setOtp(""); // Clear the input

      // Set 60 second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to resend OTP. Please try again.",
      );
    } finally {
      setResendLoading(false);
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
          {isOtpSent ? "Verify your email" : "Create an account"}
        </h2>
        {!isOtpSent && (
          <p className="mt-2 text-center text-sm text-muted2">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          {!isOtpSent ? (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted2 mb-2">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

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
                <label className="block text-sm font-medium text-muted2 mb-2">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                      Sign Up <ArrowRight size={18} />
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

              {resendSuccess && (
                <div className="bg-accent/10 border border-accent/50 text-accent text-sm p-3 rounded-xl text-center">
                  ✓ OTP sent to {email}
                </div>
              )}

              <p className="text-sm text-muted2 text-center">
                We&apos;ve sent a one-time password to{" "}
                <span className="text-text font-medium">{email}</span>. Please
                enter it below.
              </p>

              <div>
                <label className="block text-sm font-medium text-muted2 mb-2">
                  One-Time Password (OTP)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    className="input-field tracking-[0.5em] text-center text-lg"
                    placeholder="000000"
                    maxLength={6}
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
                      Verify OTP <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-sm text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : resendLoading
                      ? "Sending..."
                      : "Didn't receive OTP? Resend"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
