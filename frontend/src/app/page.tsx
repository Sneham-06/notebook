"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import UploadZone from "@/components/UploadZone";
import BlindSpotScanner from "@/components/BlindSpotScanner";
import TeachMeMode from "@/components/TeachMeMode";
import BlindSpotMode from "@/components/BlindSpotMode";
import TimeCapsule from "@/components/TimeCapsule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, X, Download, FileText, CheckCircle2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type View = "chat" | "upload" | "blind-spot" | "teach-me" | "time-capsule";

export default function Home() {
  const [activeView, setActiveView] = useState<View>("upload");
  const [activeFolder, setActiveFolder] = useState("1");
  const [isListening, setIsListening] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [chatHistories, setChatHistories] = useState<{ [key: string]: { role: string; content: string }[] }>({});

  const folderNames: { [key: string]: string } = {
    "1": "Research Papers",
    "2": "Meeting Notes",
    "3": "Product Specs",
  };

  const handleUploadComplete = () => {
    setHasUploaded(true);
    toast.success("Notes indexed successfully!", {
      description: "You can now start chatting or use the smart tools.",
    });
  };

  const buildMarkdownContent = () => {
    const now = new Date().toLocaleString();
    let md = `# NoteMind Export\n\n**Exported:** ${now}\n**Folder:** ${folderNames[activeFolder] || "All Notes"}\n\n---\n\n`;

    const msgs = chatHistories[activeFolder] || [];
    if (msgs.length > 0) {
      md += `## 💬 Chat History\n\n`;
      msgs.forEach((m) => {
        const role = m.role === "user" ? "🧑 You" : "🤖 NoteMind AI";
        md += `**${role}:**\n> ${m.content.replace(/\n/g, "\n> ")}\n\n`;
      });
    } else {
      md += `*No chat history yet. Upload documents and start chatting!*\n`;
    }
    return md;
  };

  const triggerExport = async (format: "pdf" | "md") => {
    try {
      toast.loading(`Generating ${format.toUpperCase()}...`, { id: "export-toast" });

      if (format === "md") {
        const content = buildMarkdownContent();
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notemind-export-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);

      } else if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentW = pageW - margin * 2;
        let y = 20;

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageW, 14, "F");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("NoteMind — AI Knowledge Export", margin, 9.5);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleString(), pageW - margin, 9.5, { align: "right" });

        y = 24;
        doc.setFontSize(18);
        doc.setTextColor(30, 30, 60);
        doc.setFont("helvetica", "bold");
        doc.text(`${folderNames[activeFolder] || "My Notes"}`, margin, y);
        y += 8;

        doc.setDrawColor(200, 200, 230);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        const msgs = chatHistories[activeFolder] || [];
        if (msgs.length === 0) {
          doc.setFontSize(11);
          doc.setTextColor(120, 120, 140);
          doc.setFont("helvetica", "italic");
          doc.text("No chat history yet. Upload documents and start chatting!", margin, y);
        } else {
          doc.setFontSize(13);
          doc.setTextColor(60, 60, 100);
          doc.setFont("helvetica", "bold");
          doc.text("Chat History", margin, y);
          y += 8;

          msgs.forEach((m) => {
            const isUser = m.role === "user";
            const label = isUser ? "You" : "NoteMind AI";
            const bgColor: [number, number, number] = isUser ? [237, 233, 254] : [240, 253, 244];
            const labelColor: [number, number, number] = isUser ? [99, 102, 241] : [16, 185, 129];

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...labelColor);
            doc.text(label.toUpperCase(), margin, y);
            y += 4;

            const lines = doc.splitTextToSize(m.content, contentW - 4);
            const blockH = lines.length * 5 + 6;

            if (y + blockH > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              y = 20;
            }

            doc.setFillColor(...bgColor);
            doc.roundedRect(margin, y - 2, contentW, blockH, 3, 3, "F");

            doc.setFontSize(9.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 60);
            doc.text(lines, margin + 3, y + 4);
            y += blockH + 5;
          });
        }

        // Footer
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(180, 180, 200);
          doc.setFont("helvetica", "normal");
          doc.text(`Page ${i} of ${totalPages} · Generated by NoteMind`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
        }

        doc.save(`notemind-export-${Date.now()}.pdf`);
      }

      toast.dismiss("export-toast");
      toast.success(`${format.toUpperCase()} downloaded!`, { description: "Check your Downloads folder." });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#8b5cf6', '#10b981'] });

    } catch (err) {
      console.error("Export error:", err);
      toast.dismiss("export-toast");
      toast.error("Export failed. Please try again.");
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      // @ts-ignore
      if (window.recognition) window.recognition.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening...", { description: "I'm ready for your questions." });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast.success("Heard: " + transcript);
      // Here we would ideally trigger the chat with this transcript
      // For now, let's just log it or pass it if we have a way
      window.dispatchEvent(new CustomEvent('voice-input', { detail: transcript }));
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      toast.error("Voice error: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // @ts-ignore
    window.recognition = recognition;
    recognition.start();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar 
          activeView={activeView} 
          activeFolder={activeFolder}
          onViewChange={(view) => setActiveView(view)}
          onFolderChange={(folderId) => setActiveFolder(folderId)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header / Nav */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-text-tertiary">
              {activeView === "chat" ? (activeFolder === "1" ? "Research Papers" : activeFolder === "2" ? "Meeting Notes" : "Product Specs") : activeView.replace("-", " ")}
            </h2>
            {hasUploaded && activeView !== "upload" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold gap-2 text-accent"
                onClick={() => setActiveView("upload")}
              >
                + Add More Notes
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold text-xs">
                    <Download size={14} /> Export
                  </Button>
                }
              />
              <DialogContent className="rounded-[2rem] p-8 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold mb-4">Export Center</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Options</h3>
                    <div className="space-y-2">
                      {[
                        "Include Summary",
                        "Include Blind Spots",
                        "Include Teach History",
                        "High Resolution (PDF)"
                      ].map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-border">
                          <CheckCircle2 size={16} className="text-success" />
                          <span className="text-sm font-medium">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Format</h3>
                    <div className="grid gap-3">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-1 rounded-2xl hover:border-accent hover:bg-accent-soft"
                        onClick={() => triggerExport("md")}
                      >
                        <FileText size={24} />
                        <span className="font-bold">Markdown</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-1 rounded-2xl hover:border-accent hover:bg-accent-soft"
                        onClick={() => triggerExport("pdf")}
                      >
                        <Download size={24} />
                        <span className="font-bold">PDF Document</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="w-8 h-8 rounded-full bg-surface-hover border border-border flex items-center justify-center text-[10px] font-bold">
              JD
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === "upload" && (
                <div className="h-full flex items-center justify-center p-8">
                  <UploadZone onUploadComplete={handleUploadComplete} folderId={activeFolder} />
                </div>
              )}
              {activeView === "chat" && (
                <ChatInterface 
                  folderId={activeFolder} 
                  onFolderChange={(id) => setActiveFolder(id)}
                  onMessagesChange={(folderId, msgs) =>
                    setChatHistories(prev => ({ ...prev, [folderId]: msgs }))
                  }
                />
              )}
              {activeView === "blind-spot" && (
                <BlindSpotMode 
                  hasUploaded={hasUploaded} 
                  onUploadComplete={handleUploadComplete} 
                />
              )}
              {activeView === "teach-me" && (
                <TeachMeMode 
                  hasUploaded={hasUploaded} 
                  onUploadComplete={handleUploadComplete} 
                />
              )}
              {activeView === "time-capsule" && <TimeCapsule />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Floating Voice UI */}
        <div className="absolute bottom-8 right-8 z-50">
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Button
              className={cn(
                "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500",
                isListening ? "bg-error hover:bg-error-hover" : "accent-gradient"
              )}
              onClick={() => {
                if (activeView !== "chat") {
                  setActiveView("chat");
                  toast.info("Entering Chat Mode");
                }
                toggleVoice();
              }}
            >
              {isListening ? <X size={32} /> : <Mic size={32} />}
              
              {isListening && (
                <div className="absolute inset-0 rounded-full animate-ping bg-error/20" />
              )}
            </Button>
          </motion.div>
          
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-20 right-0 w-64 bg-surface border border-border p-4 rounded-3xl shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                        className="w-1 bg-accent rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Listening...</span>
                </div>
                <p className="text-sm text-text-secondary italic">"What are the blind spots in my research paper?"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
