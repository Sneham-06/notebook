"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { BrainCircuit, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

interface AuthScreenProps {
  onLogin: (token: string, username: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        
        toast.success(`Welcome back, ${response.data.username}!`);
        onLogin(response.data.access_token, response.data.username);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          username,
          password
        });
        
        toast.success("Registration successful! Logging you in...");
        
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        onLogin(response.data.access_token, response.data.username);
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Authentication failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl rounded-[2rem] border border-border shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-accent/20">
            <BrainCircuit size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? "Welcome to NoteMind" : "Create Account"}
        </h1>
        <p className="text-text-secondary text-center mb-8 text-sm">
          {isLogin 
            ? "Enter your credentials to access your second brain" 
            : "Sign up to start organizing your knowledge"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 mt-4 accent-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all group"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="font-bold">{isLogin ? "Sign up" : "Sign in"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
