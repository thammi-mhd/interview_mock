"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { requireAuth, getToken, clearAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    if (!requireAuth(router)) return;
    if (!sessionId) {
      router.push("/interview");
      return;
    }
    fetchResults();
    setWarningCount(parseInt(sessionStorage.getItem("warningCount") || "0"));
  }, [sessionId, router]);

  const fetchResults = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/interview/details/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDetails(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/auth/login");
        return;
      }
      console.error("Failed to fetch results:", error);
      alert("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
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
          <p className="text-muted2">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted2">No results found</p>
      </div>
    );
  }

  const averageScore = details.total_score
    ? ((details.total_score / details.max_possible_score) * 100).toFixed(1)
    : 0;

  const getIntegrity = (count) => {
    if (count === 0)
      return {
        label: "Excellent",
        color: "text-accent",
        Icon: ShieldCheck,
        border: "border-accent/20",
        bg: "bg-accent/5",
      };
    if (count <= 2)
      return {
        label: "Good",
        color: "text-yellow-400",
        Icon: ShieldAlert,
        border: "border-yellow-400/20",
        bg: "bg-yellow-400/5",
      };
    if (count <= 5)
      return {
        label: "Fair",
        color: "text-orange-400",
        Icon: ShieldAlert,
        border: "border-orange-400/20",
        bg: "bg-orange-400/5",
      };
    return {
      label: "Poor",
      color: "text-red-400",
      Icon: ShieldX,
      border: "border-red-500/20",
      bg: "bg-red-500/5",
    };
  };
  const { label, color, Icon, border, bg } = getIntegrity(warningCount);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>
      <div className="absolute w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-50px] left-1/2 -translate-x-1/2 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto p-8 relative z-10">
        {/* Home Button */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="px-3 py-2 text-sm border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-2 text-sm border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
          >
            Dashboard
          </Link>
        </div>

        <h1 className="text-5xl font-bebas tracking-wide text-center text-text mb-2">
          Interview Complete!
        </h1>
        <p className="text-center text-muted2 mb-8">{details.role}</p>

        {/* Overall Score */}
        <div className="bg-surface border border-accent/20 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <div className="text-8xl font-bebas text-accent mb-2">
              {averageScore}%
            </div>
            <p className="text-xl text-muted2 mb-4">
              Score: {details.total_score} / {details.max_possible_score}
            </p>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden mb-4">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${averageScore}%` }}
              />
            </div>
            <p className="text-muted2">
              {averageScore >= 70
                ? "🎉 Excellent performance!"
                : averageScore >= 50
                  ? "👍 Good effort! Keep practicing."
                  : "💪 Keep improving! Practice more."}
            </p>
          </div>
        </div>

        <div
          className={`${bg} border ${border} rounded-2xl p-6 mb-8 flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <Icon size={28} className={color} />
            <div>
              <p className="text-muted2 text-xs uppercase tracking-widest mb-0.5">
                Interview Integrity
              </p>
              <p className={`font-bebas text-2xl tracking-wide ${color}`}>
                {label}
              </p>
            </div>
          </div>
          <p className="text-muted2 text-sm">
            {warningCount} proctoring alert{warningCount !== 1 ? "s" : ""}{" "}
            during session
          </p>
        </div>

        {(details.strengths?.length > 0 ||
          details.weaknesses?.length > 0 ||
          details.improvement_suggestions?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-accent font-bebas text-xl tracking-wide mb-3 flex items-center gap-2">
                <ShieldCheck size={18} /> Strengths
              </p>
              <ul className="space-y-2">
                {(details.strengths || []).map((s, i) => (
                  <li
                    key={i}
                    className="text-muted2 text-sm flex items-start gap-2"
                  >
                    <span className="text-accent mt-1">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-red-400 font-bebas text-xl tracking-wide mb-3 flex items-center gap-2">
                <ShieldAlert size={18} /> Weaknesses
              </p>
              <ul className="space-y-2">
                {(details.weaknesses || []).map((w, i) => (
                  <li
                    key={i}
                    className="text-muted2 text-sm flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-1">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-yellow-400 font-bebas text-xl tracking-wide mb-3">
                💡 Suggestions
              </p>
              <ul className="space-y-2">
                {(details.improvement_suggestions || []).map((s, i) => (
                  <li
                    key={i}
                    className="text-muted2 text-sm flex items-start gap-2"
                  >
                    <span className="text-yellow-400 mt-1">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {details.hiring_recommendation && (
          <div className="mb-8 flex items-center gap-3">
            <p className="text-muted2 text-sm">Hiring Recommendation:</p>
            <span
              className={`rounded-full px-5 py-1.5 text-sm font-semibold border ${
                details.hiring_recommendation === "Yes"
                  ? "bg-accent/10 text-accent border-accent/20"
                  : details.hiring_recommendation === "No"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
              }`}
            >
              {details.hiring_recommendation}
            </span>
          </div>
        )}

        {details.overall_assessment && (
          <div className="bg-surface border-l-4 border-accent p-4 rounded-r-xl text-muted2 italic text-sm mb-8">
            {details.overall_assessment}
          </div>
        )}

        {/* Question Details */}
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bebas tracking-wide text-text">
            Question Breakdown
          </h2>
          {details.questions?.map((q, idx) => (
            <div
              key={idx}
              className="bg-surface border border-border rounded-2xl p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bebas tracking-wide text-accent">
                    Question {q.question_number}
                  </h3>
                  <p className="text-text mt-2">{q.question}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bebas text-accent">
                    {q.score || "-"}
                  </div>
                  <div className="text-muted2">/10</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-muted2 text-sm uppercase tracking-widest mb-1">
                  Your Answer:
                </p>
                <p className="text-text bg-background border border-border rounded-xl p-3 text-sm">
                  {q.answer || "Not answered"}
                </p>
              </div>

              <div>
                <p className="text-muted2 text-sm uppercase tracking-widest mb-1">
                  Feedback:
                </p>
                <p className="text-muted2">
                  {q.feedback || "No feedback available"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Session Info */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bebas tracking-wide text-text mb-4">
            Session Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted2 text-sm uppercase tracking-widest">
                Role
              </p>
              <p className="font-medium text-text">{details.role}</p>
            </div>
            <div>
              <p className="text-muted2 text-sm uppercase tracking-widest">
                Status
              </p>
              <p className="font-medium text-accent">{details.status}</p>
            </div>
            <div>
              <p className="text-muted2 text-sm uppercase tracking-widest">
                Date
              </p>
              <p className="font-medium text-text">
                {new Date(details.started_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted2 text-sm uppercase tracking-widest">
                Duration
              </p>
              <p className="font-medium text-text">
                {details.ended_at
                  ? Math.round(
                      (new Date(details.ended_at) -
                        new Date(details.started_at)) /
                        60000,
                    ) + " min"
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 px-5 py-2 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors py-3"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/interview")}
            className="flex-1 btn-primary"
          >
            Try Another Interview →
          </button>
        </div>
      </div>
    </div>
  );
}
