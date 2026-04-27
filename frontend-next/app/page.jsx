"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-14 md:py-5 border-b border-transparent transition-all backdrop-blur-md bg-background/80">
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
        <div className="hidden md:flex items-center gap-9">
          <Link
            href="#how"
            className="text-muted2 text-sm font-medium hover:text-text transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#features"
            className="text-muted2 text-sm font-medium hover:text-text transition-colors"
          >
            Features
          </Link>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/auth/login"
            className="px-5 py-2 border border-border/50 rounded-full text-text text-sm font-medium hover:border-accent/30 hover:text-accent transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2 bg-accent rounded-full text-[#06070a] text-sm font-bold hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(200,240,77,0.3)] transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>

        {/* Glow orbs */}
        <div className="absolute w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-100px] left-1/2 -translate-x-1/2 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full px-4 py-1.5 text-xs font-semibold text-accent uppercase tracking-wider mb-7 relative z-10">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
          AI-powered mock interviews
        </div>

        <h1 className="font-bebas text-[clamp(64px,11vw,160px)] leading-[0.9] tracking-wide relative z-10 flex flex-col">
          <span>CRACK EVERY</span>
          <span className="text-accent">INTERVIEW</span>
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: "1px rgba(200,240,77,0.4)" }}
          >
            YOU FACE.
          </span>
        </h1>

        <p className="max-w-[560px] text-muted2 text-lg leading-relaxed mt-7 relative z-10">
          Practice with intelligent AI interviewers that adapt to your role,
          give real-time feedback, and help you land the job — not just survive
          it.
        </p>

        <div className="flex flex-wrap gap-4 mt-10 justify-center relative z-10">
          <Link href="/auth/register" className="btn-primary">
            Start Free Today <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="relative z-10 py-24 px-6 md:px-14 border-t border-border bg-surface/50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="text-xs font-semibold tracking-widest text-accent uppercase mb-4">
              Process
            </div>
            <h2 className="font-bebas text-[clamp(40px,6vw,80px)] leading-none tracking-wide mb-5">
              THREE STEPS TO
              <br />
              YOUR DREAM JOB
            </h2>
            <p className="text-muted2 text-lg max-w-[500px]">
              No fluff. No generic prep. Just a precision system that mirrors
              the real thing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-border rounded-2xl overflow-hidden">
            {[
              {
                num: "01",
                title: "Pick your role & company",
                desc: "Choose from role-specific interview tracks tailored to companies like Google, Amazon, McKinsey. We adapt the difficulty to match.",
              },
              {
                num: "02",
                title: "Interview with AI in real time",
                desc: "Our AI reacts to your answers, asks smart follow-ups, and adjusts difficulty — creating a realistically challenging experience.",
              },
              {
                num: "03",
                title: "Get scored & improve fast",
                desc: "Receive detailed feedback on clarity, structure, depth, and relevance — with annotated tips after each session.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-surface p-10 md:p-12 relative group hover:bg-s2 transition-colors"
              >
                <div className="font-bebas text-[80px] leading-none text-white/5 absolute top-6 right-8 tracking-tighter group-hover:text-accent/5 transition-colors">
                  {step.num}
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} className="text-accent" />
                </div>
                <h3 className="font-bebas text-3xl tracking-wide mb-3">
                  {step.title}
                </h3>
                <p className="text-muted2 text-[15px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-6 md:px-14 bg-background relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-6 md:h-6 bg-accent rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="w-4 h-4 md:w-3 md:h-3"
              >
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
            <span className="font-bebas tracking-wide text-lg text-text mt-1">
              Intervuo
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted2">
            <Link
              href="/privacy"
              className="hover:text-accent transition-colors"
            >
              Privacy Policy
            </Link>
            <span>© 2026. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
