"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { requireAuth, getToken, clearAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SelectRolePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [starting, setStarting] = useState(false);
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState("20 min");
  const [ongoingInterview, setOngoingInterview] = useState(null);
  const [showOngoingModal, setShowOngoingModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth(router)) return;
    fetchRoles();
    checkOngoingInterview();
  }, []);

  const checkOngoingInterview = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/interview/ongoing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.has_ongoing) {
        setOngoingInterview(response.data);
        setShowOngoingModal(true);
      }
    } catch (error) {
      console.error("Failed to check ongoing interview:", error);
    }
  };

  const handleContinueOngoing = () => {
    router.push(
      `/interview/device-check?session_id=${ongoingInterview.session_id}&role=${ongoingInterview.role}`,
    );
  };

  const handleCancelOngoing = async () => {
    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/interview/cancel/${ongoingInterview.session_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowOngoingModal(false);
      setOngoingInterview(null);
    } catch (error) {
      console.error("Failed to cancel interview:", error);
      alert("Failed to cancel interview");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/interview/roles`);
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      alert("Failed to load interview roles");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (role) => {
    setStarting(true);
    try {
      const token = getToken();
      const durationMinutes = parseInt(duration.split(" ")[0]);
      const response = await axios.post(
        `${API_URL}/interview/start`,
        {
          role,
          interview_type: interviewType,
          difficulty,
          duration_minutes: durationMinutes,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { session_id } = response.data;

      // Store config in sessionStorage
      sessionStorage.setItem(
        "interviewConfig",
        JSON.stringify({
          role,
          interviewType,
          difficulty,
          duration,
        }),
      );

      // Redirect to device check before interview
      router.push(
        `/interview/device-check?session_id=${session_id}&role=${role}`,
      );
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/auth/login");
        return;
      }
      if (error.response?.status === 409) {
        // Ongoing interview detected - show modal
        checkOngoingInterview();
        setStarting(false);
        return;
      }
      console.error("Failed to start interview:", error);
      alert(error.response?.data?.detail || "Failed to start interview");
      setStarting(false);
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
          <p className="text-muted2">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>
      <div className="absolute w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-50px] left-1/2 -translate-x-1/2 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Modal for ongoing interview */}
      {showOngoingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bebas tracking-wide text-text mb-4">
              Ongoing Interview
            </h2>
            <p className="text-muted2 mb-6">
              You have an ongoing interview as a{" "}
              <span className="text-accent font-semibold">
                {ongoingInterview?.role}
              </span>
              . Would you like to continue it or cancel it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleContinueOngoing}
                className="flex-1 px-4 py-2 bg-accent text-[#06070a] font-semibold rounded-full hover:-translate-y-1 transition-all"
              >
                Continue Interview
              </button>
              <button
                onClick={handleCancelOngoing}
                className="flex-1 px-4 py-2 border border-border text-text rounded-full hover:border-red-500/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-8 relative z-10">
        {/* Home Button */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="px-3 py-2 text-sm border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
          >
            ← Home
          </Link>
        </div>

        <h1 className="text-5xl font-bebas tracking-wide text-center text-text mb-2">
          AI Interview Simulator
        </h1>
        <p className="text-center text-muted2 mb-12">
          Select a role to practice your interview skills
        </p>

        {/* Config Section */}
        <div className="bg-surface border border-border rounded-2xl p-8 mb-12">
          {/* Interview Type */}
          <div className="mb-8">
            <p className="text-sm font-bebas tracking-wide text-text mb-3 uppercase">
              Interview Type
            </p>
            <div className="flex gap-3 flex-wrap">
              {["Technical", "HR", "Mixed"].map((type) => (
                <button
                  key={type}
                  onClick={() => setInterviewType(type)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                    interviewType === type
                      ? "bg-accent/10 border-accent text-accent"
                      : "border border-border/50 text-muted2 cursor-pointer hover:border-accent/30"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-8">
            <p className="text-sm font-bebas tracking-wide text-text mb-3 uppercase">
              Difficulty
            </p>
            <div className="flex gap-3 flex-wrap">
              {["Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                    difficulty === diff
                      ? "bg-accent/10 border-accent text-accent"
                      : "border border-border/50 text-muted2 cursor-pointer hover:border-accent/30"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-sm font-bebas tracking-wide text-text mb-3 uppercase">
              Duration
            </p>
            <div className="flex gap-3 flex-wrap">
              {["10 min", "20 min", "30 min"].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                    duration === dur
                      ? "bg-accent/10 border-accent text-accent"
                      : "border border-border/50 text-muted2 cursor-pointer hover:border-accent/30"
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role}
              className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === role
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <h3 className="text-lg font-bebas tracking-wide text-text mb-2">
                {role}
              </h3>
              <p className="text-muted2 text-sm mb-4">
                {role === "Python Developer"
                  ? "Practice Python fundamentals, OOP, and advanced concepts"
                  : role === "Frontend Developer"
                    ? "Practice React, JavaScript, and CSS"
                    : role === "Backend Developer"
                      ? "Practice API design, databases, and architecture"
                      : role === "Full Stack Developer"
                        ? "Practice both frontend and backend skills"
                        : "Practice machine learning and data analysis"}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartInterview(role);
                }}
                disabled={starting || selectedRole !== role}
                className={`w-full py-2 rounded-full font-semibold transition-all ${
                  selectedRole === role
                    ? "btn-primary"
                    : "px-4 py-2 border border-border/50 text-muted2 rounded-full cursor-not-allowed"
                }`}
              >
                {starting && selectedRole === role
                  ? "Starting..."
                  : "Start Interview"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors"
          >
            Home
          </Link>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
