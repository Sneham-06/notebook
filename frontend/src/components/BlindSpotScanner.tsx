"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Zap, RefreshCw, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface BlindSpot {
  id: string;
  claim: string;
  why_incomplete: string;
  whats_missing: string[];
  suggested_fix: string;
}

const BlindSpotScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<BlindSpot[]>([]);

  const startScan = async () => {
    setIsScanning(true);
    setResults([]);
    try {
      const sessionId = "session_123";
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tools/blind-spot`, {
        session_id: sessionId,
        content: "The current implementation of the auth system is secure. Performance is optimized for high traffic."
      });

      let rawResults: any = response.data.results;
      
      // If it's a string, try to extract JSON using a robust regex
      if (typeof rawResults === 'string') {
        const jsonMatch = rawResults.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            rawResults = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("Failed to parse matched JSON:", e);
          }
        }
      }

      // Ensure rawResults is an array
      const resultsArray = Array.isArray(rawResults) ? rawResults : [rawResults];

      setResults(resultsArray.filter(r => r && typeof r === 'object').map((r: any, i: number) => ({
        id: i.toString(),
        claim: r.claim || "Potential Blind Spot",
        why_incomplete: r.why_incomplete || "Analysis pending...",
        whats_missing: Array.isArray(r.whats_missing) ? r.whats_missing : [],
        suggested_fix: r.suggested_fix || "Check context for more details."
      })));
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to run diagnostic scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Blind Spot Scanner</h2>
          <p className="text-text-secondary">Note Mind identifies logical gaps and missing context in your work.</p>
        </div>
        <Button 
          onClick={startScan} 
          disabled={isScanning}
          className="accent-gradient shadow-lg px-8 py-6 rounded-2xl gap-2 font-bold"
        >
          {isScanning ? <RefreshCw className="animate-spin h-5 w-5" /> : <Zap className="h-5 w-5" />}
          {isScanning ? "Scanning..." : "Run Diagnostic Scan"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isScanning ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[1, 2].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-surface-hover border border-border animate-pulse relative overflow-hidden">
                <div className="shimmer absolute inset-0" />
              </div>
            ))}
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-6"
          >
            {results.map((spot, idx) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="rounded-3xl border-border hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-error/5 p-6 md:w-1/3 border-r border-border">
                      <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-widest mb-4">
                        <AlertCircle size={14} />
                        The Claim
                      </div>
                      <p className="text-sm font-semibold text-text-primary leading-relaxed">
                        "{spot.claim}"
                      </p>
                    </div>
                    
                    <div className="p-6 flex-1 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Why it's incomplete</h4>
                        <p className="text-sm text-text-secondary">{spot.why_incomplete}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">What's missing</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {spot.whats_missing.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                              <div className="w-1 h-1 rounded-full bg-error" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-success/5 p-6 md:w-1/4 flex flex-col justify-between border-l border-border">
                      <div>
                        <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-widest mb-4">
                          <CheckCircle2 size={14} />
                          Suggested Fix
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed mb-4">
                          {spot.suggested_fix}
                        </p>
                      </div>
                      <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest hover:bg-success hover:text-white transition-colors">
                        Apply Fix
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="ghost" className="gap-2 text-text-secondary font-bold">
                <Copy size={16} />
                Copy All Fixes
              </Button>
              <Button variant="ghost" className="gap-2 text-text-secondary font-bold">
                <Download size={16} />
                Export Results
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-hover rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold">No scans run yet</h3>
            <p className="text-text-secondary text-sm">Select a note or folder and click the button to reveal blind spots.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlindSpotScanner;
