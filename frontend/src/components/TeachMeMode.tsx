"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Mic, Smile, Frown, CheckCircle2, ArrowRight, BookOpen, Trophy, Loader2, Plus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface TeachMeProps {
  hasUploaded: boolean;
  onUploadComplete: () => void;
}

const TeachMeMode = ({ hasUploaded, onUploadComplete }: TeachMeProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [evaluation, setEvaluation] = useState<"good" | "needs-work" | null>(null);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(20);
  const [dynamicQuestion, setDynamicQuestion] = useState("");
  const [dynamicFeedback, setDynamicFeedback] = useState("");
  const [importanceScore, setImportanceScore] = useState<number>(0);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const fetchQuestion = async () => {
    setIsLoadingQuestion(true);
    setIsAnswered(false);
    setEvaluation(null);
    setAnswer("");
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tools/teach-me`, {
        session_id: "session_123",
      });
      const q = response.data.question;
      setDynamicQuestion(q);
      setImportanceScore(response.data.importance_score || 0);
      speakQuestion(q);
    } catch (error) {
      console.error("Fetch question error:", error);
      toast.error("Failed to get question.");
      setDynamicQuestion("I couldn't find enough context. Please upload more notes!");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (hasUploaded && !dynamicQuestion) {
      fetchQuestion();
    }
  }, [hasUploaded]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", "session_123");
    formData.append("folder_id", "teach-me");

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload`, formData);
      onUploadComplete();
      fetchQuestion();
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error("Please type or speak an answer first!");
      return;
    }
    
    setIsAnswered(true);
    setEvaluation(null);
    setDynamicFeedback("Analyzing your explanation...");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tools/evaluate-answer`, {
        question: dynamicQuestion,
        answer: answer
      });
      
      setEvaluation(response.data.evaluation);
      setDynamicFeedback(response.data.feedback);
      
      if (response.data.evaluation === "good") {
        setProgress(p => Math.min(p + 25, 100));
      }
    } catch (error) {
      toast.error("Evaluation failed");
      setEvaluation("needs-work");
      setDynamicFeedback("Something went wrong with the grading. Try again!");
    }
  };

  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Microphone on. I'm listening!");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setAnswer(prev => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please check your browser settings.");
      } else {
        toast.error("Speech recognition error. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    
    // Auto-stop after 10 seconds of silence/no input
    setTimeout(() => {
      recognition.stop();
    }, 10000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    if (score >= 40) return "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
    return "bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  };

  if (!hasUploaded) {
    return (
      <div className="max-w-2xl mx-auto p-12 flex flex-col items-center justify-center h-full text-center space-y-8">
        <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center shadow-lg">
          <GraduationCap className="text-emerald-600 h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Master Your Topic</h2>
          <p className="text-slate-500 text-lg">Upload notes to start your mastery session.</p>
        </div>
        <div className="relative group">
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleUpload} disabled={isUploading} />
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-8 rounded-[2rem] text-xl font-bold gap-4 shadow-xl">
            {isUploading ? <Loader2 className="animate-spin" /> : <BookOpen size={28} />}
            {isUploading ? "Uploading..." : "Start Learning"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <GraduationCap className="text-emerald-600 h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Teach Me Mode</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Session</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
            <p className="text-sm font-bold text-emerald-600">{progress}% Mastered</p>
          </div>
          <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div animate={{ width: `${progress}%` }} className="h-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={fetchQuestion}
          className="lg:col-span-1 flex lg:flex-col items-center justify-center p-6 bg-white rounded-[2rem] border-2 border-dashed border-indigo-100 hover:border-indigo-400 cursor-pointer h-fit gap-4 lg:gap-6 shadow-sm transition-all"
        >
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-indigo-50 flex items-center justify-center relative shadow-inner">
            <Smile className="h-10 w-10 lg:h-14 lg:w-14 text-indigo-600" />
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-2 shadow-md">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
          </div>
          <div className="text-left lg:text-center">
            <h3 className="font-bold text-slate-800">Mindful Student</h3>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
              <RefreshCw size={10} /> Tap to Refresh
            </p>
          </div>
        </motion.div>

        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!isAnswered ? (
              <motion.div key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-sm relative min-h-[160px] flex flex-col justify-center">
                  {isLoadingQuestion ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-indigo-600" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">Question</span>
                        <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider", getScoreColor(importanceScore))}>
                          {importanceScore}% Exam Chance
                        </div>
                      </div>
                      <h3 className="text-2xl font-medium leading-relaxed text-slate-800">
                        {dynamicQuestion || "Click the student to start..."}
                      </h3>
                    </>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    className="w-full h-48 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 text-lg outline-none focus:border-indigo-200 shadow-sm transition-all placeholder:text-slate-300"
                    placeholder="Explain it like I'm five..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <div className="absolute right-6 bottom-6 flex gap-3">
                    <Button 
                      variant={isListening ? "destructive" : "ghost"} 
                      size="icon" 
                      onClick={startListening} 
                      className={cn(
                        "w-12 h-12 rounded-2xl transition-all",
                        isListening ? "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "hover:bg-indigo-50 text-indigo-600"
                      )}
                    >
                      {isListening ? <Loader2 className="animate-spin" /> : <Mic size={24} />}
                    </Button>
                    <Button onClick={submitAnswer} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl font-bold gap-2 h-12 shadow-lg">
                      Submit Explanation <ArrowRight size={20} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="e" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn(
                "p-10 rounded-[3rem] border-2 flex flex-col items-center text-center space-y-6",
                evaluation === "good" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
              )}>
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg", evaluation === "good" ? "bg-emerald-500" : "bg-amber-500")}>
                  {evaluation === "good" ? <Trophy className="text-white" size={40} /> : <BookOpen className="text-white" size={40} />}
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{evaluation === "good" ? "Perfect!" : "Almost There"}</h3>
                <p className="text-lg text-slate-600 max-w-lg leading-relaxed">{dynamicFeedback}</p>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setIsAnswered(false)} className="rounded-2xl px-8 h-12 border-2">Try Again</Button>
                  <Button onClick={fetchQuestion} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 h-12 font-bold">Next Concept</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TeachMeMode;
