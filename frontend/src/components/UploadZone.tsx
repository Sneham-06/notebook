"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface UploadZoneProps {
  onUploadComplete: (files: any[]) => void;
  folderId?: string;
}

const UploadZone = ({ onUploadComplete, folderId }: UploadZoneProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    // In a real app, we would upload to backend here
    startMockUpload(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    }
  });

  const startMockUpload = async (newFiles: File[]) => {
    setUploading(true);
    setProgress(0);
    
    try {
      const sessionId = "session_123";
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("session_id", sessionId);
        formData.append("folder_id", folderId || "default");

        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload`, formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            setProgress(percentCompleted);
          }
        });
      }
      onUploadComplete(newFiles);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to upload files";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const loadDemo = () => {
    setUploading(true);
    setProgress(30);
    setTimeout(() => setProgress(70), 500);
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
      onUploadComplete([{ name: "Demo Note 1.pdf" }, { name: "Demo Note 2.md" }]);
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer",
            isDragActive 
              ? "border-success bg-success-soft/20 shadow-glow" 
              : "border-border hover:border-accent hover:bg-surface-hover"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-4">
            <Upload className={cn("h-8 w-8 text-accent", isDragActive && "animate-bounce")} />
          </div>
          <h2 className="text-xl font-bold mb-2">Drop your knowledge here</h2>
          <p className="text-text-secondary text-sm mb-6 text-center">
            PDF, Markdown, or Text files. We'll diagnose, teach, and summarize.
          </p>
          
          <div className="flex gap-2">
            {["PDF", "MD", "TXT"].map(ext => (
              <span key={ext} className="px-2 py-1 bg-surface-elevated border border-border rounded text-[10px] font-bold text-text-tertiary">
                {ext}
              </span>
            ))}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-8">
              <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
              <p className="text-sm font-semibold mb-2">Indexing your notes...</p>
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex justify-between items-center px-2">
        <div className="flex gap-2">
          {files.map((f, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex items-center gap-1.5 bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium"
            >
              <FileText className="h-3.5 w-3.5 text-text-tertiary" />
              {f.name}
            </motion.div>
          ))}
        </div>
        <Button variant="ghost" className="text-accent hover:text-accent-hover text-xs font-bold" onClick={loadDemo}>
          Load Demo Data
        </Button>
      </div>
    </div>
  );
};

export default UploadZone;
