"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Clock } from "lucide-react";
import { requireAuth, getToken, clearAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showingResult, setShowingResult] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [inactivityTimer, setInactivityTimer] = useState(0);
  const [warningLevel, setWarningLevel] = useState(0);
  
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const synthRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!requireAuth(router)) return;
    if (!sessionId) {
      router.push("/interview");
      return;
    }
    initializeCamera();
    fetchQuestion();

    // Cleanup camera on unmount
    return () => stopCamera();
  }, [sessionId, router]);

  useEffect(() => {
    if (currentQuestion) {
      playQuestionAudio();
      setInactivityTimer(0);
      setWarningLevel(0);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (currentQuestion && !recording && textAnswer.length === 0 && !submitting) {
      const timer = setInterval(() => {
        setInactivityTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setInactivityTimer(0);
      setWarningLevel(0);
    }
  }, [currentQuestion, recording, textAnswer, submitting]);

  useEffect(() => {
    if (inactivityTimer === 15) {
      setWarningLevel(1);
    } else if (inactivityTimer === 30) {
      setWarningLevel(2);
      handleFinishInterview();
    }
  }, [inactivityTimer]);

  // Attach camera stream to video element once it's rendered (after loading)
  useEffect(() => {
    if (!loading && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  }, [loading]);

  useEffect(() => {
    // Initialize timer from sessionStorage
    const config = JSON.parse(
      sessionStorage.getItem("interviewConfig") || "{}",
    );
    const totalSeconds = (config.duration || "20 min").split(" ")[0] * 60;
    setTimeLeft(totalSeconds);

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-finish interview when time runs out
          handleFinishInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to access camera/audio:", error);
      alert("Failed to access camera/audio");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const fetchQuestion = async (qNum = questionNumber) => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/interview/question/${sessionId}/${qNum}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCurrentQuestion(response.data.question);
      if (response.data.total_questions) {
        setTotalQuestions(response.data.total_questions);
      }
      setTextAnswer("");
      setScore(null);
      setFeedback(null);
      setShowingResult(false);
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/auth/login");
        return;
      }
      console.error("Failed to fetch question:", error);
      alert(error.response?.data?.detail || "Failed to fetch question");
    } finally {
      setLoading(false);
    }
  };

  const playQuestionAudio = () => {
    if ("speechSynthesis" in window && currentQuestion) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording");
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

  const stopRecording = async () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.onstop = async () => {
          const rawBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const wavBlob = await convertBlobToWav(rawBlob);
          setRecording(false);
          audioChunksRef.current = [];
          resolve(wavBlob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  const submitAnswer = async (audioBlob = null) => {
    if (!textAnswer && !audioBlob) {
      alert("Please provide an answer or record audio");
      return;
    }

    setSubmitting(true);
    
    const token = getToken();
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("question_number", questionNumber);

    if (audioBlob) {
      formData.append("audio_file", audioBlob, "answer.wav");
    } else if (textAnswer) {
      formData.append("answer_text", textAnswer);
    }

    // Fire and forget validation in the background!
    axios.post(
      `${API_URL}/interview/submit-answer`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    ).catch((error) => {
      console.error("Failed to submit answer in background:", error);
    });

    // Advance immediately on the frontend
    setTimeout(() => {
      setSubmitting(false);
      if (questionNumber === totalQuestions) {
        setInterviewComplete(true);
        handleFinishInterview();
      } else {
        handleNextQuestion(questionNumber + 1);
      }
    }, 800); // Slight delay so the user sees the "Submitting..." state briefly
  };

  const handleSubmitAudio = async () => {
    setSubmitting(true);
    const audioBlob = await stopRecording();
    await submitAnswer(audioBlob);
  };

  const handleSubmitText = async () => {
    await submitAnswer();
  };

  const handleNextQuestion = (nextQNum = questionNumber + 1) => {
    if (nextQNum <= totalQuestions) {
      setQuestionNumber(nextQNum);
      fetchQuestion(nextQNum);
    }
  };

  const handleFinishInterview = async () => {
    setProcessing(true);
    stopCamera(); // Stop camera hardware immediately
    
    // Play Thank You audio
    try {
      const utterance = new SpeechSynthesisUtterance("Thank you for completing this interview. We are now processing your results.");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }

    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/interview/end/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Wait 4 seconds to allow the voice to finish before redirecting
      await new Promise((r) => setTimeout(r, 4000));
      router.push(`/interview/results/${sessionId}`);
    } catch (error) {
      console.error("Failed to finish interview:", error);
      alert("Failed to finish interview");
      setProcessing(false);
    }
  };

  if (!sessionId || loading) {
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
          <p className="text-muted2">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text p-4">
      {warningLevel === 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm font-medium px-6 py-2.5 text-center animate-pulse">
          ⚠️ Warning: Suspicious inactivity detected. Please start answering the question immediately.
        </div>
      )}
      {warningLevel === 2 && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6">
          <h2 className="font-bebas text-5xl text-red-500">Interview Terminated</h2>
          <p className="text-muted2">Suspicious inactivity detected.</p>
        </div>
      )}
      {processing && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-border border-t-accent rounded-full animate-spin" />
          <h2 className="font-bebas text-4xl tracking-wide text-text">
            Analyzing your performance...
          </h2>
          <p className="text-muted2 text-sm">
            Our AI is reviewing your answers
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-surface border-b border-border px-6 py-4 flex justify-between items-center mb-4 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs border border-border/50 rounded-full text-muted2 hover:text-accent hover:border-accent/30 transition-colors"
            >
              ← Home
            </Link>
            <h1 className="text-2xl font-bebas tracking-wide text-text">
              Interview Session
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            <span className="bg-accent/10 text-accent border border-accent/20 rounded-full px-4 py-1.5 text-sm font-semibold">
              Question {questionNumber} of {totalQuestions}
            </span>
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-1.5 border rounded-full text-sm font-semibold ${
                  timeLeft > 60
                    ? "text-accent border-accent/20 bg-accent/10"
                    : timeLeft > 30
                      ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
                      : "text-red-400 border-red-400/20 bg-red-400/10"
                }`}
              >
                <Clock size={16} />
                <span>
                  {Math.floor(timeLeft / 60)}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Interview Area */}
        <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
          {/* Video Section - Left */}
          <div className="bg-black rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="flex-1 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-surface/80 px-3 py-1.5 text-muted2 text-xs">
              Your camera feed
            </div>
          </div>

          {/* Question Section - Right */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
            <h2 className="text-4xl font-bebas text-accent mb-6">
              Question {questionNumber}
            </h2>


                <div className="flex-1 mb-6">
                  <p className="text-text text-lg leading-relaxed">
                    {currentQuestion}
                  </p>
                  
                  
                  <div className="mt-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3">
                    <span className="text-green-400 font-semibold text-sm">
                      You may now begin your answer.
                    </span>
                    <button
                      onClick={() => handleNextQuestion(questionNumber + 1)}
                      disabled={submitting}
                      className="ml-auto px-4 py-1 text-xs bg-surface border border-border text-muted2 rounded-full hover:text-text transition-colors"
                    >
                      Skip Question →
                    </button>
                  </div>

                  <button
                    onClick={playQuestionAudio}
                    disabled={submitting}
                    className="mt-4 px-5 py-2 border border-border/50 text-text rounded-full hover:border-accent/30 transition-colors disabled:opacity-50"
                  >
                    🔊 Repeat Question
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Audio Recording Controls */}
                  <div>
                    <label className="text-muted2 text-sm uppercase tracking-widest mb-2 block">
                      Answer via Voice:
                    </label>
                    <div className="flex gap-2">
                      {!recording ? (
                        <button
                          onClick={startRecording}
                          disabled={submitting}
                          className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full px-5 py-2 hover:border-red-500/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          🎤 Start Recording
                        </button>
                      ) : (
                        <>
                          <span className="flex-1 flex items-center justify-center bg-red-500/10 border border-red-500/30 rounded-full px-5 py-2">
                            <span className="animate-pulse text-red-400">
                              Recording...
                            </span>
                          </span>
                          <button
                            onClick={handleSubmitAudio}
                            disabled={submitting}
                            className="btn-primary"
                          >
                            ✓ {submitting ? "Submitting..." : "Submit Audio"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Text Answer */}
                  <div>
                    <label className="text-muted2 text-sm uppercase tracking-widest mb-2 block">
                      Or type your answer:
                    </label>
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      disabled={submitting}
                      placeholder="Type your answer here (minimum 10 characters)"
                      className="input-field disabled:opacity-50"
                      rows="4"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitText}
                    disabled={submitting || textAnswer.length < 10}
                    className={`w-full py-2 rounded-full font-semibold transition-all ${
                      submitting || textAnswer.length < 10
                        ? "opacity-40 cursor-not-allowed btn-primary"
                        : "btn-primary"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-muted2 text-sm">
          <p>Remaining questions: {totalQuestions - questionNumber}</p>
        </div>
      </div>
    </div>
  );
}
