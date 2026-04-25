"use client";

import React, { useState } from "react";
import { Clock, Calendar, ArrowRight, History, Share2, Download, CheckCircle2, TrendingUp, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UploadZone from "@/components/UploadZone";

const TimeCapsule = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [capsuleData, setCapsuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tools/time-capsule`, {
        session_id: "session_123"
      });
      setCapsuleData(response.data);
    } catch (error) {
      console.error("Time Capsule error:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleUploadComplete = () => {
    setIsUploadOpen(false);
    fetchData(); // Refresh data after upload
  };

  const defaultVersions = {
    v1: {
      date: "Initial State",
      label: "Discovery Phase",
      content: "Gathering basic concepts and foundational knowledge from your uploads."
    },
    v4: {
      date: "Present",
      label: "Expert Analysis",
      content: "Advanced synthesis of all documents with deep logical connections and mastery."
    }
  };

  const v1 = capsuleData?.v1 || defaultVersions.v1;
  const v4 = capsuleData?.v4 || defaultVersions.v4;
  const growth = capsuleData?.growth || ["Logical Mapping", "Deep Synthesis", "Contextual Mastery"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Time Capsule</h2>
          <p className="text-text-secondary">Compare how your knowledge has evolved over time.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger
              render={
                <Button className="rounded-xl gap-2 font-bold text-xs uppercase tracking-widest bg-accent hover:bg-accent-hover text-white">
                  <Upload size={14} /> Update Knowledge
                </Button>
              }
            />
            <DialogContent className="max-w-3xl bg-surface border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Upload New Module</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <UploadZone onUploadComplete={handleUploadComplete} />
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="rounded-xl gap-2 font-bold text-xs uppercase tracking-widest">
            <Share2 size={14} /> Share Summary
          </Button>
        </div>
      </div>

      {/* Comparison Panel */}
      <div className="relative group">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden rounded-[2.5rem] bg-surface-hover border border-border p-1">
          {/* Week 1 Panel */}
          <div className="p-10 bg-surface rounded-[2rem] shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-surface-hover border border-border rounded-full">
                <Calendar size={12} className="text-text-tertiary" />
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{v1.date}</span>
              </div>
              <span className="text-xs font-bold text-text-tertiary">Phase 1</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">{v1.label}</h3>
              <p className="text-sm text-text-secondary leading-relaxed bg-surface-hover/30 p-6 rounded-2xl border border-dashed border-border">
                {v1.content}
              </p>
            </div>
          </div>

          {/* Week 4 Panel */}
          <div className="p-10 bg-surface rounded-[2rem] shadow-sm flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full">
                <TrendingUp size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Growth Detected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-accent-soft text-accent border border-accent/20 rounded-full">
                <Calendar size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{v4.date}</span>
              </div>
              <span className="text-xs font-bold text-accent">Phase 4</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">{v4.label}</h3>
              <div className="text-sm text-text-secondary leading-relaxed bg-accent-soft/20 p-6 rounded-2xl border border-accent/10">
                {v4.content.split(' ').map((word: string, i: number) => (
                    <span key={i} className={cn(
                        growth.some((g: string) => word.toLowerCase().includes(g.toLowerCase())) ? "bg-success-soft text-success px-1 rounded mx-0.5" : ""
                    )}>
                        {word}{' '}
                    </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Range Slider Scrubber */}
        <div className="mt-8 px-12">
          <div className="relative h-12 flex items-center">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-accent" 
                  style={{ width: `${sliderValue}%` }}
                />
              </div>
            </div>
            <input 
              type="range" 
              className="w-full h-1 bg-transparent appearance-none cursor-pointer relative z-10 accent-accent"
              value={sliderValue}
              onChange={(e) => setSliderValue(parseInt(e.target.value))}
            />
          </div>
          <div className="flex justify-between px-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            <span>The Past</span>
            <span>The Present</span>
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { step: "Discovery", info: "Gathered initial concepts and papers.", date: "Week 1", status: "completed" },
          { step: "Analysis", info: "Applied Blind Spot Scanner to first draft.", date: "Week 2", status: "completed" },
          { step: "Mastery", info: "Completed 5 Teach Me modules.", date: "Week 4", status: "current" },
        ].map((item, i) => (
          <div key={i} className={cn(
            "p-6 rounded-[2rem] border transition-all duration-300",
            item.status === "completed" ? "bg-surface-hover border-border" : "bg-accent-soft border-accent/20"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                item.status === "completed" ? "bg-success text-white" : "bg-accent text-white"
              )}>
                {item.status === "completed" ? <CheckCircle2 size={16} /> : <History size={16} />}
              </div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{item.date}</span>
            </div>
            <h4 className="font-bold mb-1">{item.step}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">{item.info}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeCapsule;
