"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-14 md:py-5 border-b border-border backdrop-blur-md bg-background/80">
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
            href="/"
            className="px-5 py-2 border border-border/50 rounded-full text-text text-sm font-medium hover:border-accent/30 hover:text-accent transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="relative z-10 py-24 px-6 md:px-14 pt-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-bebas text-[clamp(40px,8vw,80px)] leading-tight tracking-wide text-text mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Introduction
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                Intervuo ("we," "us," "our," or "Company") is committed to
                protecting your privacy. This Privacy Policy explains how we
                collect, use, disclose, and otherwise handle your information
                when you use our website, mobile application, and related
                services (collectively, the "Service").
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bebas text-xl tracking-wide text-accent mb-2">
                    Personal Information
                  </h3>
                  <p className="text-muted2 leading-relaxed">
                    We collect information you voluntarily provide, including:
                  </p>
                  <ul className="list-disc list-inside text-muted2 mt-2 space-y-1">
                    <li>Name and email address during registration</li>
                    <li>Password and authentication credentials</li>
                    <li>Profile information you choose to provide</li>
                    <li>Interview responses and audio recordings</li>
                    <li>Feedback and communication you send us</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bebas text-xl tracking-wide text-accent mb-2">
                    Automatically Collected Information
                  </h3>
                  <p className="text-muted2 leading-relaxed">
                    When you use our Service, we automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-muted2 mt-2 space-y-1">
                    <li>
                      Device information (browser type, IP address, device type)
                    </li>
                    <li>
                      Usage data (pages visited, time spent, interactions)
                    </li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Location information (with your consent)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted2 text-lg leading-relaxed mb-4">
                We use the information we collect for various purposes,
                including:
              </p>
              <ul className="list-disc list-inside text-muted2 space-y-1">
                <li>Providing, maintaining, and improving our Service</li>
                <li>Processing your registration and managing your account</li>
                <li>Conducting and scoring interviews</li>
                <li>Sending you service-related announcements and updates</li>
                <li>Responding to your inquiries and providing support</li>
                <li>Analyzing trends and improving user experience</li>
                <li>Detecting and preventing fraudulent activity</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Information Sharing and Disclosure
              </h2>
              <div className="space-y-4">
                <p className="text-muted2 text-lg leading-relaxed">
                  We do not sell your personal information. We may share your
                  information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted2 space-y-1">
                  <li>
                    <span className="text-accent font-semibold">
                      Service Providers:
                    </span>{" "}
                    With third-party providers who assist us in operating our
                    website and conducting our business
                  </li>
                  <li>
                    <span className="text-accent font-semibold">
                      Legal Requirements:
                    </span>{" "}
                    When required by law or to protect our rights, privacy,
                    safety, or property
                  </li>
                  <li>
                    <span className="text-accent font-semibold">
                      Business Transfers:
                    </span>{" "}
                    In connection with a merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <span className="text-accent font-semibold">
                      With Your Consent:
                    </span>{" "}
                    When you authorize us to share your information
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Security of Your Information
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. However, no
                method of transmission over the Internet is 100% secure, and we
                cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Your Rights and Choices
              </h2>
              <div className="space-y-4">
                <p className="text-muted2 text-lg leading-relaxed">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc list-inside text-muted2 space-y-1">
                  <li>
                    <span className="text-accent font-semibold">Access:</span>{" "}
                    Request access to your personal information
                  </li>
                  <li>
                    <span className="text-accent font-semibold">
                      Correction:
                    </span>{" "}
                    Request correction of inaccurate information
                  </li>
                  <li>
                    <span className="text-accent font-semibold">Deletion:</span>{" "}
                    Request deletion of your information
                  </li>
                  <li>
                    <span className="text-accent font-semibold">Opt-Out:</span>{" "}
                    Opt out of marketing communications
                  </li>
                  <li>
                    <span className="text-accent font-semibold">
                      Data Portability:
                    </span>{" "}
                    Request your information in a portable format
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Cookies and Tracking Technologies
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                We use cookies and similar tracking technologies to enhance your
                experience, remember your preferences, and understand how you
                use our Service. You can control cookies through your browser
                settings, though this may affect functionality.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Third-Party Links
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                Our Service may contain links to third-party websites. We are
                not responsible for the privacy practices of these external
                sites. We encourage you to review their privacy policies before
                providing any information.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Children's Privacy
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                Our Service is not intended for children under the age of 13. We
                do not knowingly collect personal information from children
                under 13. If we become aware of such collection, we will take
                steps to delete such information and terminate the child's
                account.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Data Retention
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                We retain your personal information for as long as necessary to
                provide our Service, comply with legal obligations, and resolve
                disputes. You can request deletion of your account and
                associated data at any time.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                International Data Transfers
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                Your information may be transferred to, stored in, and processed
                in countries other than your country of residence. These
                countries may not provide the same level of data protection as
                your home country. By using our Service, you consent to such
                transfers.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Changes to This Privacy Policy
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. The date of the last update will be
                indicated at the top of the policy. Continued use of our Service
                following the posting of revised Privacy Policy means that you
                accept and agree to the changes.
              </p>
            </div>

            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-text mb-4">
                Contact Us
              </h2>
              <p className="text-muted2 text-lg leading-relaxed">
                If you have questions about this Privacy Policy or our privacy
                practices, please contact us at:
              </p>
              <div className="mt-4 p-6 bg-surface border border-border rounded-2xl">
                <p className="text-muted2">
                  <span className="text-accent font-semibold">Email:</span>{" "}
                  privacy@intervuo.com
                </p>
                <p className="text-muted2 mt-2">
                  <span className="text-accent font-semibold">Address:</span>{" "}
                  Intervuo Inc., Privacy Team
                </p>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-border/50">
              <p className="text-muted2 text-sm">Last Updated: April 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-6 md:px-14 bg-background/50 relative z-10">
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
          <p className="text-sm text-muted2">© 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
