"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      // Save token and user info
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: response.data.email,
          name: response.data.name || "User",
        }),
      );

      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
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
          Welcome back
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {verified === "true" && (
              <div className="bg-accent/10 border border-accent/20 text-accent text-sm p-3 rounded-xl text-center">
                ✓ Email verified! You can now sign in.
              </div>
            )}
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
              <label className="block text-sm font-medium text-muted2 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot your password?
                </Link>
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
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-muted2">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted2">
              Registered but not verified?{" "}
              <Link
                href="/auth/verify"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Verify email
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
