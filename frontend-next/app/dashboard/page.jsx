"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { requireAuth, getToken, getUser, clearAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!requireAuth(router)) return;
    const user = getUser() || {};
    setUserName(user.name || "User");
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/interview/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data.sessions || []);
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/auth/login");
        return;
      }
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sessionId) => {
    router.push(`/interview/results/${sessionId}`);
  };

  const handleStartInterview = () => {
    router.push("/interview");
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>

      {/* Glow orbs */}
      <div className="absolute w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-50px] left-1/2 -translate-x-1/2 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-14 py-12">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between mb-12 pb-8 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
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
            <span className="font-bebas text-2xl tracking-wide text-text mt-1">
              Intervuo
            </span>
          </Link>
          <div className="flex gap-3 items-center">
            <Link
              href="/auth/login"
              onClick={handleLogout}
              className="px-5 py-2 border border-border/50 rounded-full text-text text-sm font-medium hover:border-accent/30 hover:text-accent transition-colors"
            >
              Logout
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-bebas text-[clamp(40px,8vw,80px)] leading-tight tracking-wide text-text mb-3">
            Welcome, <span className="text-accent">{userName}</span>! 👋
          </h1>
          <p className="text-muted2 text-lg max-w-[500px]">
            Track your interview practice and improve your skills with
            personalized feedback.
          </p>
        </div>

        {/* Start New Interview Button */}
        <button
          onClick={handleStartInterview}
          className="mb-12 w-full md:w-auto px-8 py-4 bg-accent text-[#06070a] font-bold text-lg rounded-2xl hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(200,240,77,0.25)] transition-all"
        >
          🚀 Start New Interview
        </button>

        {/* Interview History */}
        <div>
          <h2 className="font-bebas text-4xl tracking-wide text-text mb-8">
            Interview History
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="animate-spin">
                  <svg
                    className="w-8 h-8 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path
                      strokeLinecap="round"
                      strokeDasharray="60"
                      strokeDashoffset="60"
                      d="M12 2a10 10 0 010 20"
                    />
                  </svg>
                </div>
                <p className="text-muted2">Loading interview history...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-2xl bg-surface/30">
              <p className="text-muted2 text-lg">
                No interviews yet. Start your first interview!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session, idx) => {
                const percentage = session.max_possible_score
                  ? (
                      (session.total_score / session.max_possible_score) *
                      100
                    ).toFixed(1)
                  : "-";

                const statusBg =
                  session.status === "completed"
                    ? "bg-accent/10 border-accent/50"
                    : "bg-surface";
                const statusText =
                  session.status === "completed"
                    ? "text-accent"
                    : "text-muted2";

                return (
                  <div
                    key={idx}
                    className={`p-4 md:p-6 rounded-2xl border border-border ${statusBg} hover:border-accent/50 transition-all cursor-pointer group`}
                    onClick={() => handleViewDetails(session.session_id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bebas text-2xl tracking-wide text-text">
                            {session.role}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusText} ${statusBg}`}
                          >
                            {session.status.charAt(0).toUpperCase() +
                              session.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-muted2 text-sm">
                          {new Date(session.started_at).toLocaleDateString()} •{" "}
                          {session.answered_questions}/{session.total_questions}{" "}
                          questions
                        </p>
                      </div>
                      <div className="flex items-center gap-6 md:gap-12">
                        <div className="text-right">
                          <p className="text-muted2 text-xs uppercase tracking-wide mb-1">
                            Score
                          </p>
                          <p
                            className={`font-bebas text-3xl tracking-wide ${percentage >= 70 ? "text-accent" : percentage >= 50 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {percentage}%
                          </p>
                        </div>
                        {session.status === "completed" && (
                          <div className="text-accent group-hover:translate-x-1 transition-transform">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl border border-border bg-surface/30 backdrop-blur">
              <p className="text-muted2 text-xs uppercase tracking-wide mb-3">
                Total Interviews
              </p>
              <p className="font-bebas text-5xl tracking-wide text-accent">
                {history.length}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-surface/30 backdrop-blur">
              <p className="text-muted2 text-xs uppercase tracking-wide mb-3">
                Average Score
              </p>
              <p className="font-bebas text-5xl tracking-wide text-accent">
                {history.length > 0
                  ? (
                      (history.reduce(
                        (sum, s) => sum + (s.total_score || 0),
                        0,
                      ) /
                        history.reduce(
                          (sum, s) => sum + (s.max_possible_score || 1),
                          1,
                        )) *
                      100
                    ).toFixed(1) + "%"
                  : "-"}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-surface/30 backdrop-blur">
              <p className="text-muted2 text-xs uppercase tracking-wide mb-3">
                Completed
              </p>
              <p className="font-bebas text-5xl tracking-wide text-accent">
                {history.filter((s) => s.status === "completed").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
