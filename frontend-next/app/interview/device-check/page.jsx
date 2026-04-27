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
  const [submittingMic, setSubmittingMic] = useState(false);

  // Speaker
  const [speakerOk, setSpeakerOk] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [speakerConfirmed, setSpeakerConfirmed] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

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

    // Check microphone availability
    checkMicrophoneAvailability();

    // Fetch test phrase from backend
    axios.get(`${API_URL}/interview/audio-test`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(res => {
      setTestPhrase(res.data.test_text || "Hello, I am ready for my interview today.");
    }).catch(err => {
      console.error("Failed to fetch test phrase", err);
      setTestPhrase("Hello, I am ready for my interview today.");
    });

    return () => {
      stopCamera();
      if (faceCheckIntervalRef.current)
        clearInterval(faceCheckIntervalRef.current);
    };
  }, [sessionId, role, router]);

  const checkMicrophoneAvailability = async () => {
    try {
      // Just check if microphone is available, don't actually use it yet
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      // Microphone is available but don't mark as OK yet - let user test it
    } catch (error) {
      console.error("Microphone availability check failed:", error);
      alert(
        `⚠️ Microphone not available: ${error.name}\n\nMake sure:\n- Microphone permissions are enabled in browser\n- No other app is using the microphone\n- Your device has a working microphone`,
      );
    }
  };

  // Start continuous face detection after models load
  useEffect(() => {
    if (!modelsLoaded || !cameraOk || !videoRef.current || faceOk) return; // Stop checking once face is confirmed

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
  }, [modelsLoaded, cameraOk, faceOk]);

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
      // Request microphone with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setRecordingMic(false);
          alert("No audio was recorded. Please try again.");
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await submitMicrophoneAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      console.log("🎤 Recording started");

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          console.log("🎤 Recording auto-stopped after 10 seconds");
          mediaRecorderRef.current.stop();
          setRecordingMic(false);
        }
      }, 10000);
    } catch (error) {
      console.error("Microphone access failed:", error);
      setRecordingMic(false);
      const errorMsg =
        error.name === "NotAllowedError"
          ? "Permission denied. Please allow microphone access in browser settings."
          : error.name === "NotFoundError"
            ? "No microphone found on your device."
            : error.message;
      alert(
        `❌ Microphone Error:\n\n${errorMsg}\n\nTroubleshooting:\n✓ Check browser microphone permissions\n✓ Allow access when prompted\n✓ Close other apps using the mic`,
      );
      setMicOk(false);
    }
  };

  const stopMicrophoneTest = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      console.log("🛑 Manual stop recording");
      mediaRecorderRef.current.stop();
      setRecordingMic(false);
    }
  };

  const convertBlobToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let pos = 0;

    const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
    
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);
    
    for (let i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i));
    
    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    
    return new Blob([buffer], { type: "audio/wav" });
  };

  const submitMicrophoneAudio = async (audioBlob) => {
    try {
      setSubmittingMic(true);
      if (!audioBlob || audioBlob.size === 0) {
        alert("Audio recording is empty. Please try again.");
        setRecordingMic(false);
        return;
      }

      // Convert WebM/browser blob to pristine PCM WAV
      const wavBlob = await convertBlobToWav(audioBlob);

      const formData = new FormData();
      formData.append("audio_file", wavBlob, "audio.wav");

      console.log(`📤 Sending audio (${wavBlob.size} bytes) to server...`);

      const response = await axios.post(
        `${API_URL}/interview/audio-test`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      const transcribedText = response.data.transcribed_text || "";
      console.log(`🎤 Transcription result: "${transcribedText}"`);

      setMicTranscript(transcribedText);

      // Check if we got meaningful transcription (at least 3 characters)
      if (transcribedText && transcribedText.trim().length >= 3) {
        console.log("✅ Microphone test passed!");
        setMicOk(true);
      } else {
        console.warn("⚠️ Transcription too short or empty");
        alert(
          "Could not clearly detect your voice. Please:\n✓ Speak louder and clearer\n✓ Reduce background noise\n✓ Try again",
        );
        setMicOk(false);
      }
    } catch (error) {
      console.error("❌ Microphone test failed:", error);
      console.error("Error response:", error.response?.data);

      const errorDetail = error.response?.data?.detail || error.message;
      alert(
        `Microphone test error:\n\n${errorDetail}\n\nPlease check:\n✓ Your internet connection\n✓ Backend server is running\n✓ Audio permissions are granted`,
      );
      setMicOk(false);
    } finally {
      setSubmittingMic(false);
      setRecordingMic(false);
    }
  };

  const testSpeaker = async () => {
    setTestingSpeaker(true);
    try {
      const textToSpeak = testPhrase || "Hello, I am ready for my interview today.";

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

    setShowWarning(true);
  };

  const confirmStartInterview = async () => {
    setLoading(true);
    setShowWarning(false);
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
                    className={`w-full h-full object-cover ${faceOk ? "opacity-75" : ""}`}
                  />
                  {/* Face Detection Indicator */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/50 backdrop-blur">
                    {faceOk ? (
                      <span className="text-accent flex items-center gap-1">
                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                        ✓ Face Verified
                      </span>
                    ) : faceDetected ? (
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

            {faceError && !faceOk && (
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
                  <p className="text-accent font-semibold text-sm flex items-center gap-1">
                    <CheckCircle2 size={16} /> Face verification complete
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
                <p className="text-muted2 text-xs mb-2">
                  Please repeat this phrase clearly:
                </p>
                <p className="text-lg font-semibold tracking-wide text-accent mb-4 p-2 bg-accent/5 rounded-lg">
                  "{testPhrase}"
                </p>
                <p className="text-muted2 text-xs">
                  ⏱️ Recording will stop automatically after 10 seconds
                </p>
              </div>

              {micTranscript && (
                <div className="bg-background border border-border/50 rounded-xl p-4">
                  <p className="text-muted2 text-xs mb-2">We heard:</p>
                  <p className="text-sm text-text italic">"{micTranscript}"</p>
                </div>
              )}

              <button
                onClick={
                  recordingMic ? stopMicrophoneTest : startMicrophoneTest
                }
                disabled={!cameraOk || submittingMic}
                className={`w-full py-3 px-4 rounded-full font-semibold transition-all text-sm ${
                  submittingMic
                    ? "bg-surface border border-border text-muted2 cursor-not-allowed"
                    : recordingMic
                    ? "bg-red-500 border border-red-600 text-white hover:bg-red-600"
                    : "btn-primary"
                }`}
              >
                {submittingMic ? (
                  "Processing Audio..."
                ) : recordingMic ? (
                  <>
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      🔴 Recording... (Click to stop)
                    </span>
                  </>
                ) : (
                  "🎤 Start Recording"
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

        {/* Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <h3 className="text-xl font-bebas tracking-wide text-text">
                    Important Notice
                  </h3>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-text font-semibold mb-2">Do Not Cheat</p>
                <p className="text-muted2 text-sm">
                  If you are caught cheating during the interview, your session
                  will be terminated immediately and your results will be
                  invalidated. This includes:
                </p>
                <ul className="text-muted2 text-sm mt-3 space-y-1 ml-4">
                  <li>• Looking away from the screen</li>
                  <li>• Multiple people in frame</li>
                  <li>• Using external help or resources</li>
                  <li>• Attempting to circumvent proctoring</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-4 py-2 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartInterview}
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? "Starting..." : "I Understand, Proceed"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
