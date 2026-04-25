"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, Loader2, BookOpen, AlertTriangle, Lightbulb, CheckCircle, Upload, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface BlindSpotProps {
  hasUploaded: boolean;
  onUploadComplete: () => void;
}

const BlindSpotMode = ({ hasUploaded, onUploadComplete }: BlindSpotProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const analyzeBlindSpots = async () => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tools/blind-spot`, {
        session_id: "session_123",
      });
      setResults(response.data.results || []);
      if (response.data.results.length === 0) {
        toast.info("No major blind spots found! Your notes look solid.");
      }
    } catch (error) {
      toast.error("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (hasUploaded && results.length === 0) {
      analyzeBlindSpots();
    }
  }, [hasUploaded]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", "session_123");
    formData.append("folder_id", "blind-spot");

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload`, formData);
      onUploadComplete();
      analyzeBlindSpots();
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasUploaded) {
    return (
      <div className="max-w-2xl mx-auto p-12 flex flex-col items-center justify-center h-full text-center space-y-8">
        <div className="w-24 h-24 rounded-[2.5rem] bg-amber-50 flex items-center justify-center shadow-lg border border-amber-100">
          <ShieldAlert className="text-amber-600 h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-800">Blind Spot Scanner</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Upload your research or notes. We'll scan for logical gaps, unsupported claims, and missing context.
          </p>
        </div>
        <div className="relative group">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            onChange={handleUpload} 
            disabled={isUploading} 
          />
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-8 rounded-[2rem] text-xl font-bold gap-4 shadow-xl transition-all hover:scale-105 active:scale-95">
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={28} />}
            {isUploading ? "Scanning..." : "Upload & Analyze"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <ShieldAlert className="text-amber-600 h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Logic Scanner</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Document</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={analyzeBlindSpots} 
          disabled={isAnalyzing}
          className="rounded-2xl gap-2 border-2 hover:bg-amber-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin h-4 w-4" /> : <Search size={18} />}
          Refresh Analysis
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-400 blur-xl opacity-20 animate-pulse" />
              <Loader2 className="h-16 w-16 text-amber-600 animate-spin relative z-10" />
            </div>
            <p className="text-lg font-medium text-slate-600">Identifying logical gaps...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            <AnimatePresence mode="popLayout">
              {results.map((res, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                      res.type === "Logical Gap" ? "bg-rose-50 text-rose-600" : 
                      res.type === "Missing Evidence" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {res.type}
                    </div>
                    <AlertTriangle size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-3">{res.issue}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {res.explanation}
                  </p>
                  <div className="p-5 bg-slate-50 rounded-2xl flex items-start gap-3 border border-slate-100">
                    <Lightbulb size={20} className="text-amber-500 mt-1 flex-shrink-0" />
                    <p className="text-sm italic text-slate-700">
                      <span className="font-bold not-italic text-slate-900 block mb-1">Recommendation:</span>
                      {res.suggestion}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {results.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-800">Perfect Logic!</h3>
                <p className="text-slate-500">I couldn't find any major blind spots in this document.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlindSpotMode;
