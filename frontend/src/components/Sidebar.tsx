"use client";

import React from "react";
import { 
  Search, 
  Clock, 
  GraduationCap, 
  Download, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  activeFolder: string;
  onViewChange: (view: any) => void;
  onFolderChange: (folderId: string) => void;
}

const Sidebar = ({ activeView, activeFolder, onViewChange, onFolderChange }: SidebarProps) => {
  return (
    <div className="w-[280px] h-screen bg-surface border-r border-border flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">NOTE MIND</h1>
        </div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-widest">Premium Intelligence</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* Recent History Grouped */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Recent History</h3>
          </div>
          
          <div className="space-y-4">
            {/* Category: Research */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-text-tertiary/50 uppercase px-2">Research</p>
              {[
                { id: "1", name: "PDF Concepts Analysis" },
                { id: "1b", name: "Literature Review Q1" },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 h-8 group px-2",
                    activeFolder === item.id ? "bg-accent-soft text-accent" : "text-text-secondary"
                  )}
                  onClick={() => {
                    onFolderChange(item.id.charAt(0)); // Maps to folder 1
                    onViewChange("chat");
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Button>
              ))}
            </div>

            {/* Category: Meetings */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-text-tertiary/50 uppercase px-2">Meetings</p>
              {[
                { id: "2", name: "Strategy Sync Apr 25" },
                { id: "2b", name: "Budget Planning" },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 h-8 group px-2",
                    activeFolder === item.id ? "bg-accent-soft text-accent" : "text-text-secondary"
                  )}
                  onClick={() => {
                    onFolderChange(item.id.charAt(0)); // Maps to folder 2
                    onViewChange("chat");
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Button>
              ))}
            </div>
            {/* Category: Product Specs */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-text-tertiary/50 uppercase px-2">Product Specs</p>
              {[
                { id: "3", name: "Feature Roadmap" },
                { id: "3b", name: "User Flow v2" },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 h-8 group px-2",
                    activeFolder === item.id ? "bg-accent-soft text-accent" : "text-text-secondary"
                  )}
                  onClick={() => {
                    onFolderChange(item.id.charAt(0)); // Maps to folder 3
                    onViewChange("chat");
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Tools */}
        <div>
          <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-2">Smart Tools</h3>
          <div className="space-y-1">
            {[
              { id: "blind-spot", icon: Search, label: "Blind Spot Scanner", color: "text-error" },
              { id: "teach-me", icon: GraduationCap, label: "Teach Me Mode", color: "text-success" },
              { id: "time-capsule", icon: Clock, label: "Time Capsule", color: "text-warning" },
            ].map((tool) => (
              <Button
                key={tool.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  activeView === tool.id ? "bg-accent-soft text-accent" : "text-text-secondary"
                )}
                onClick={() => onViewChange(tool.id)}
              >
                <tool.icon className={cn("h-4 w-4", tool.color)} />
                <span className="text-sm font-medium">{tool.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div>
          <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-2">Export</h3>
          <Button variant="ghost" className="w-full justify-start gap-3 text-text-secondary h-10">
            <Download className="h-4 w-4 text-info" />
            <span className="text-sm font-medium">Export Center</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
