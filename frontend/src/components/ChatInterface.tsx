"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Copy, ChevronDown, ChevronUp, Bot, User, Quote, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  citations?: { content: string; source: string; page: number }[];
}

interface ChatInterfaceProps {
  folderId: string;
  onFolderChange: (id: string) => void;
  onMessagesChange?: (folderId: string, msgs: { role: string; content: string }[]) => void;
}

const ChatInterface = ({ folderId, onFolderChange, onMessagesChange }: ChatInterfaceProps) => {
  const [histories, setHistories] = useState<{ [key: string]: Message[] }>({
    "1": [{ id: "start-1", role: "ai", content: "Context: **Research Papers**. How can I help?" }],
    "2": [{ id: "start-2", role: "ai", content: "Context: **Meeting Notes**. Shall we summarize?" }],
    "3": [{ id: "start-3", role: "ai", content: "Context: **Product Specs**. Need a technical review?" }],
  });
  
  const messages = histories[folderId] || [];
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const folders = [
    { id: "1", name: "Research Papers", color: "bg-blue-500" },
    { id: "2", name: "Meeting Notes", color: "bg-emerald-500" },
    { id: "3", name: "Product Specs", color: "bg-purple-500" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleVoiceInput = (e: any) => {
      const transcript = e.detail;
      if (transcript) {
        handleSend(transcript);
      }
    };
    window.addEventListener('voice-input', handleVoiceInput);
    return () => window.removeEventListener('voice-input', handleVoiceInput);
  }, [folderId]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    
    // Update local history for active folder
    setHistories(prev => ({
      ...prev,
      [folderId]: [...(prev[folderId] || []), userMessage]
    }));
    
    setInput("");
    setIsTyping(true);

    try {
      const sessionId = "session_123"; // In a real app, this would be dynamic
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        session_id: sessionId,
        query: textToSend,
        folder_id: folderId
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response.data.answer,
        citations: response.data.citations
      };
      
      setHistories(prev => {
        const updated = { ...prev, [folderId]: [...(prev[folderId] || []), aiMessage] };
        onMessagesChange?.(folderId, updated[folderId].map(m => ({ role: m.role, content: m.content })));
        return updated;
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to get response from AI";
      toast.error(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide" ref={scrollRef}>
        {/* Folder Pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onFolderChange(f.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border",
                folderId === f.id
                  ? `${f.color} text-white border-transparent shadow-lg scale-105`
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
              )}
            >
              {f.name}
            </button>
          ))}
        </div>

        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "flex gap-4 max-w-4xl mx-auto",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              msg.role === "ai" ? "bg-accent text-white" : "bg-surface-hover text-text-secondary border border-border"
            )}>
              {msg.role === "ai" ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className={cn(
              "flex flex-col gap-2 max-w-[80%]",
              msg.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "user" 
                  ? "bg-accent text-white rounded-tr-none shadow-md" 
                  : "bg-surface border border-border text-text-primary rounded-tl-none shadow-sm"
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="w-full mt-2">
                  <button 
                    onClick={() => setExpandedCitation(expandedCitation === msg.id ? null : msg.id)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary hover:text-accent transition-colors px-1"
                  >
                    <Quote size={10} />
                    {msg.citations.length} CITATIONS
                    {expandedCitation === msg.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedCitation === msg.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-2">
                          {msg.citations.map((cit, idx) => (
                            <div key={idx} className="p-3 bg-surface-hover border border-border rounded-xl text-xs">
                              <p className="text-text-secondary italic mb-2">"{cit.content}"</p>
                              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-text-tertiary">
                                <span>{cit.source}</span>
                                <span>PAGE {cit.page}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot size={18} />
            </div>
            <div className="flex gap-1 items-center bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-accent rounded-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            className="w-full bg-surface border border-border rounded-2xl pl-4 pr-24 py-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-accent-soft transition-all"
            placeholder="Ask anything about your notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button variant="ghost" size="icon" className="text-text-tertiary hover:text-accent rounded-xl">
              <Mic size={20} />
            </Button>
            <Button 
              size="icon" 
              className="accent-gradient shadow-md rounded-xl"
              onClick={() => handleSend()}
            >
              <Send size={20} className="text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
