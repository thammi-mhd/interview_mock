"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  loadModels,
  detectFace,
  DETECTION_INTERVAL_MS,
} from "@/lib/faceDetection";
import {
  ShieldCheck,
  Mic,
  Volume2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { requireAuth, getToken, clearAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TEST_PHRASES = [
  "The quick brown fox jumps over the lazy dog",
  "Hello, I am ready for the interview",
  "My name is on the resume",
  "Thank you for this opportunity",
  "I am excited to discuss this role",
];

export default function DeviceCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const role = searchParams.get("role");

  // Camera & Face Detection
  const [cameraOk, setCameraOk] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);

  // Microphone
  const [micOk, setMicOk] = useState(false);
  const [recordingMic, setRecordingMic] = useState(false);
  const [testPhrase, setTestPhrase] = useState("");
  const [micTranscript, setMicTranscript] = useState("");

  // Speaker
  const [speakerOk, setSpeakerOk] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [speakerConfirmed, setSpeakerConfirmed] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [checkingCamera, setCheckingCamera] = useState(false);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const faceCheckIntervalRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if (!requireAuth(router)) return;
    if (!sessionId || !role) {
      router.push("/interview");
      return;
    }

    // Load face detection models
    loadModels()
      .then(() => setModelsLoaded(true))
      .catch(console.error);

    // Start camera immediately
    startCamera();

    // Set a random test phrase
    setTestPhrase(
      TEST_PHRASES[Math.floor(Math.random() * TEST_PHRASES.length)],
    );

    return () => {
      stopCamera();
      if (faceCheckIntervalRef.current)
        clearInterval(faceCheckIntervalRef.current);
    };
  }, [sessionId, role, router]);

  // Start continuous face detection after models load
  useEffect(() => {
    if (!modelsLoaded || !cameraOk || !videoRef.current) return;

    faceCheckIntervalRef.current = setInterval(async () => {
      try {
        const result = await detectFace(videoRef.current);
        if (
          result.faceDetected &&
          !result.multipleFaces &&
          !result.lookingAway &&
          !result.lookingDown
        ) {
          setFaceDetected(true);
          setFaceError("");
          setFaceOk(true);
        } else {
          setFaceDetected(false);
          setFaceOk(false);
          if (!result.faceDetected) {
            setFaceError(
              "❌ Face not detected. Please position yourself in frame.",
            );
          } else if (result.multipleFaces) {
            setFaceError(
              "❌ Multiple faces detected. Only one person allowed.",
            );
          } else if (result.lookingAway) {
            setFaceError("⚠️ Look towards the camera.");
          } else if (result.lookingDown) {
            setFaceError("⚠️ Look towards the camera.");
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, DETECTION_INTERVAL_MS);

    return () => {
      if (faceCheckIntervalRef.current)
        clearInterval(faceCheckIntervalRef.current);
    };
  }, [modelsLoaded, cameraOk]);

  const startCamera = async () => {
    setCheckingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOk(true);
    } catch (error) {
      console.error("Camera access failed:", error);
      alert("Failed to access camera. Please check permissions.");
    } finally {
      setCheckingCamera(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOk(false);
  };

  const startMicrophoneTest = async () => {
    setRecordingMic(true);
    setMicTranscript("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await submitMicrophoneAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
          setRecordingMic(false);
        }
      }, 10000);
    } catch (error) {
      console.error("Microphone access failed:", error);
      alert("Failed to access microphone. Please check permissions.");
      setRecordingMic(false);
    }
  };

  const stopMicrophoneTest = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setRecordingMic(false);
    }
  };

  const submitMicrophoneAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await axios.post(
        `${API_URL}/interview/audio-test`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMicTranscript(response.data.transcribed_text || "");
      if (
        response.data.transcribed_text &&
        response.data.transcribed_text.length > 3
      ) {
        setMicOk(true);
      } else {
        alert(
          "Could not detect your voice. Please try again in a quiet environment.",
        );
      }
    } catch (error) {
      console.error("Microphone test failed:", error);
      alert("Microphone test failed. Please try again.");
    }
  };

  const testSpeaker = async () => {
    setTestingSpeaker(true);
    try {
      const response = await axios.get(`${API_URL}/interview/audio-test`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const textToSpeak =
        response.data.test_text || "This is a speaker test. Can you hear this?";

      // Use Web Speech API for text-to-speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speaker test failed:", error);
      // Fallback: use simple beep
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } finally {
      setTestingSpeaker(false);
    }
  };

  const handleProceedToInterview = async () => {
    if (!cameraOk || !faceOk || !micOk || !speakerOk) {
      alert("Please complete all device checks before proceeding");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();

      await axios.post(
        `${API_URL}/interview/health-check`,
        {
          camera_detected: cameraOk,
          microphone_detected: micOk,
          speaker_detected: speakerOk,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      router.push(`/interview/${sessionId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/auth/login");
        return;
      }
      console.error("Health check failed:", error);
      alert("Device verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(200,240,77,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,240,77,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_20%,transparent_80%)]"></div>
      <div className="absolute w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(200,240,77,0.1)_0%,transparent_70%)] top-[-50px] left-1/2 -translate-x-1/2 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto p-8 relative z-10">
        {/* Home Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/"
            className="px-3 py-2 text-sm border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
          >
            ← Home
          </Link>
        </div>

        <h1 className="text-5xl font-bebas tracking-wide text-center text-text mb-2">
          System Verification
        </h1>
        <p className="text-center text-muted2 mb-8">
          {role} - Testing camera, microphone, speaker, and face detection
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Camera & Face Detection - Large */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bebas tracking-wide text-text">
                📹 Camera & Face Detection
              </h3>
              {cameraOk && <CheckCircle2 size={20} className="text-accent" />}
            </div>

            {/* Video Stream */}
            <div className="mb-4 bg-black rounded-2xl border border-border overflow-hidden h-80 flex items-center justify-center relative">
              {cameraOk ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Face Detection Indicator */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/50 backdrop-blur">
                    {faceDetected ? (
                      <span className="text-accent flex items-center gap-1">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                        Face Detected
                      </span>
                    ) : (
                      <span className="text-red-400">No Face</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle size={40} className="text-muted2" />
                  <span className="text-muted2">Camera not started</span>
                </div>
              )}
            </div>

            {faceError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-3">
                {faceError}
              </div>
            )}

            {cameraOk ? (
              <div>
                <p className="text-accent font-semibold text-sm mb-2">
                  ✓ Camera working
                </p>
                {faceOk && (
                  <p className="text-accent font-semibold text-sm">
                    ✓ Face detected
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={startCamera}
                disabled={checkingCamera}
                className="w-full btn-primary"
              >
                {checkingCamera ? "Starting..." : "Start Camera"}
              </button>
            )}
          </div>

          {/* Status Panel */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-lg font-bebas tracking-wide text-text mb-4">
              Status
            </h3>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${cameraOk && faceOk ? "bg-accent/10" : "bg-red-500/10"}`}
              >
                <span>{cameraOk && faceOk ? "✓" : "✗"}</span>
                <span
                  className={
                    cameraOk && faceOk ? "text-accent" : "text-red-400"
                  }
                >
                  Camera & Face
                </span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${micOk ? "bg-accent/10" : "bg-red-500/10"}`}
              >
                <span>{micOk ? "✓" : "✗"}</span>
                <span className={micOk ? "text-accent" : "text-red-400"}>
                  Microphone
                </span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${speakerOk ? "bg-accent/10" : "bg-red-500/10"}`}
              >
                <span>{speakerOk ? "✓" : "✗"}</span>
                <span className={speakerOk ? "text-accent" : "text-red-400"}>
                  Speaker
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Microphone Test */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic size={20} className="text-accent" />
            <h3 className="text-xl font-bebas tracking-wide text-text">
              🎤 Microphone Test
            </h3>
            {micOk && <CheckCircle2 size={20} className="text-accent" />}
          </div>

          {!micOk ? (
            <div className="space-y-4">
              <div className="bg-background border border-border/50 rounded-xl p-4">
                <p className="text-muted2 text-sm mb-3">
                  Please repeat this phrase:
                </p>
                <p className="text-2xl font-bebas tracking-wide text-accent mb-4">
                  {testPhrase}
                </p>
                <p className="text-muted2 text-xs">
                  Recording will stop after 10 seconds
                </p>
              </div>

              {micTranscript && (
                <div className="bg-background border border-border/50 rounded-xl p-4">
                  <p className="text-muted2 text-sm mb-2">We heard:</p>
                  <p className="text-text italic">"{micTranscript}"</p>
                </div>
              )}

              <button
                onClick={
                  recordingMic ? stopMicrophoneTest : startMicrophoneTest
                }
                disabled={!cameraOk}
                className={`w-full py-3 rounded-full font-semibold transition-all ${
                  recordingMic
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "btn-primary"
                }`}
              >
                {recordingMic ? (
                  <>
                    <span className="animate-pulse">
                      🔴 Recording... (Click to stop)
                    </span>
                  </>
                ) : (
                  "Start Recording"
                )}
              </button>
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <p className="text-accent font-semibold flex items-center gap-2">
                <CheckCircle2 size={20} />
                Microphone verified!
              </p>
              <p className="text-muted2 text-sm mt-2">
                Heard: "{micTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Speaker Test */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={20} className="text-accent" />
            <h3 className="text-xl font-bebas tracking-wide text-text">
              🔊 Speaker Test
            </h3>
            {speakerOk && <CheckCircle2 size={20} className="text-accent" />}
          </div>

          {!speakerOk ? (
            <div className="space-y-4">
              <p className="text-muted2">
                Click below to play a test sound. Can you hear it?
              </p>

              <button
                onClick={testSpeaker}
                disabled={testingSpeaker || !cameraOk}
                className="w-full btn-primary"
              >
                {testingSpeaker ? "Playing audio..." : "▶ Play Test Audio"}
              </button>

              {testingSpeaker && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <p className="text-accent font-semibold">
                    🔊 Listen for the audio...
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSpeakerOk(true);
                  }}
                  className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-full hover:bg-accent/20 transition-all"
                >
                  ✓ Yes, I can hear it
                </button>
                <button
                  onClick={() => {
                    alert("Please adjust your speaker volume and try again.");
                  }}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full hover:bg-red-500/20 transition-all"
                >
                  ✗ I cannot hear it
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <p className="text-accent font-semibold flex items-center gap-2">
                <CheckCircle2 size={20} />
                Speaker verified!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/"
            className="flex-1 px-5 py-3 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors text-center"
          >
            Home
          </Link>
          <button
            onClick={() => router.back()}
            className="flex-1 px-5 py-3 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleProceedToInterview}
            disabled={!cameraOk || !faceOk || !micOk || !speakerOk || loading}
            className={`flex-1 py-3 rounded-full font-semibold transition-all ${
              cameraOk && faceOk && micOk && speakerOk && !loading
                ? "btn-primary"
                : "opacity-40 cursor-not-allowed btn-primary"
            }`}
          >
            {loading ? "Verifying..." : "Start Interview →"}
          </button>
        </div>
      </div>
    </div>
  );
}
