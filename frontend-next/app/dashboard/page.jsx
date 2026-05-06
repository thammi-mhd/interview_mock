"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { requireAuth, getToken, getUser, clearAuth } from "@/lib/auth";
import ProfileMenu from "@/components/ProfileMenu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    bestScore: 0,
    lastInterviewDate: null,
  });

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
      const sessions = response.data.sessions || [];
      setHistory(sessions);
      calculateStats(sessions);
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

  const calculateStats = (sessions) => {
    if (sessions.length === 0) {
      setStats({
        totalInterviews: 0,
        averageScore: 0,
        completedInterviews: 0,
        bestScore: 0,
        lastInterviewDate: null,
      });
      return;
    }

    const completed = sessions.filter((s) => s.status === "completed");
    const scores = completed.map(
      (s) => (s.total_score / (s.max_possible_score || 1)) * 100,
    );
    const avgScore =
      scores.length > 0
        ? (scores.reduce((a, b) => a + b) / scores.length).toFixed(1)
        : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores).toFixed(1) : 0;

    setStats({
      totalInterviews: sessions.length,
      averageScore: avgScore,
      completedInterviews: completed.length,
      bestScore: bestScore,
      lastInterviewDate: sessions[0]?.started_at || null,
    });
  };

  const handleViewDetails = (sessionId) => {
    router.push(`/interview/results/${sessionId}`);
  };

  const handleStartInterview = () => {
    router.push("/interview");
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
          <ProfileMenu />
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-bebas text-[clamp(40px,8vw,80px)] leading-tight tracking-wide text-text mb-3">
            Welcome back, <span className="text-accent">{userName}</span>
          </h1>
          <p className="text-muted2 text-lg max-w-[500px]">
            Track your interview practice and improve your skills with
            personalized feedback.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-xl border border-border bg-surface/30 backdrop-blur">
            <p className="text-muted2 text-xs uppercase tracking-wide mb-2">
              Total Interviews
            </p>
            <p className="font-bebas text-4xl tracking-wide text-accent">
              {stats.totalInterviews}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface/30 backdrop-blur">
            <p className="text-muted2 text-xs uppercase tracking-wide mb-2">
              Average Score
            </p>
            <p className="font-bebas text-4xl tracking-wide text-accent">
              {stats.averageScore}%
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface/30 backdrop-blur">
            <p className="text-muted2 text-xs uppercase tracking-wide mb-2">
              Best Score
            </p>
            <p className="font-bebas text-4xl tracking-wide text-accent">
              {stats.bestScore}%
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface/30 backdrop-blur">
            <p className="text-muted2 text-xs uppercase tracking-wide mb-2">
              Completed
            </p>
            <p className="font-bebas text-4xl tracking-wide text-accent">
              {stats.completedInterviews}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-12 p-8 rounded-2xl border border-border bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bebas tracking-wide text-text mb-2">
                Ready for your next challenge?
              </h2>
              <p className="text-muted2">
                Start a new interview session and track your progress over time.
              </p>
            </div>
            <button
              onClick={handleStartInterview}
              className="flex-shrink-0 px-8 py-4 bg-accent text-[#06070a] font-bold text-lg rounded-2xl hover:shadow-[0_12px_30px_rgba(200,240,77,0.25)] transition-all whitespace-nowrap"
            >
              Start New Interview
            </button>
          </div>
        </div>

        {/* Interview History */}
        <div>
          <h2 className="font-bebas text-4xl tracking-wide text-text mb-8">
            Recent Interviews
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
              <svg
                className="w-16 h-16 mx-auto text-muted2 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm0 0V6m12 13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm0 0V6"
                />
              </svg>
              <p className="text-muted2 text-lg mb-4">No interviews yet</p>
              <p className="text-muted2 text-sm">
                Start your first interview to see your progress here.
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
                          {session.interview_type} • {session.difficulty}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-border bg-surface/30">
            <svg
              className="w-8 h-8 text-accent mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="font-bebas text-lg text-text mb-2">
              Get Started Quickly
            </h3>
            <p className="text-muted2 text-sm">
              Choose your role and difficulty level, then start practicing with
              real-time feedback.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-surface/30">
            <svg
              className="w-8 h-8 text-accent mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="font-bebas text-lg text-text mb-2">
              Track Progress
            </h3>
            <p className="text-muted2 text-sm">
              View your interview history and detailed feedback to identify
              areas for improvement.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-surface/30">
            <svg
              className="w-8 h-8 text-accent mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-bebas text-lg text-text mb-2">
              Improve Skills
            </h3>
            <p className="text-muted2 text-sm">
              Get AI-powered feedback and personalized recommendations to ace
              your interviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
