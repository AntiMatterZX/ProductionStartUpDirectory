"use client"

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  Cog,
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminSidebar = () => {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const currentPath = pathname.split("/")[2] || "dashboard"; 

  return (
    <motion.nav
      initial={{ width: open ? 240 : 80 }}
      animate={{ width: open ? 240 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 h-screen z-30 bg-white dark:bg-gray-900 border-r border-border shadow-sm"
    >
      <div className="flex flex-col h-full">
        <TitleSection open={open} />
        
        <div className="space-y-1 px-3 py-2">
          <NavItem
            icon={LayoutDashboard}
            title="Dashboard"
            path="/admin/dashboard"
            currentPath={currentPath}
            open={open}
          />
          <NavItem
            icon={Shield}
            title="Moderation"
            path="/admin/moderation"
            currentPath={currentPath}
            open={open}
            badge={{ count: 5, variant: "default" }}
          />
          <NavItem
            icon={Users}
            title="Users"
            path="/admin/users"
            currentPath={currentPath}
            open={open}
          />
          <NavItem
            icon={BarChart3}
            title="Analytics"
            path="/admin/analytics"
            currentPath={currentPath}
            open={open}
          />
          <NavItem
            icon={Cog}
            title="Settings"
            path="/admin/settings"
            currentPath={currentPath}
            open={open}
          />
        </div>
        
        <ToggleButton open={open} setOpen={setOpen} />
      </div>
    </motion.nav>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  title: string;
  path: string;
  currentPath: string;
  open: boolean;
  badge?: {
    count: number;
    variant: 'default' | 'secondary' | 'destructive';
  };
}

const NavItem = ({ icon: Icon, title, path, currentPath, open, badge }: NavItemProps) => {
  const isActive = currentPath === title.toLowerCase();
  
  return (
    <Link href={path}>
      <motion.div
        className={cn(
          "flex items-center h-10 rounded-md transition-all duration-200 overflow-hidden group", 
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-secondary"
        )}
        initial={{ opacity: 1 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="grid place-items-center h-10 w-10 text-lg shrink-0">
          <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        </div>
        
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex items-center justify-between flex-1 pr-3"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                {title}
              </span>
              
              {badge && (
                <span 
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium",
                    {
                      "bg-primary text-white": badge.variant === "default",
                      "bg-destructive text-destructive-foreground": badge.variant === "destructive",
                      "bg-secondary text-secondary-foreground": badge.variant === "secondary",
                    }
                  )}
                >
                  {badge.count}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
};

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="border-b border-border p-4">
      <div className="flex items-center space-x-2">
        <div className="relative h-8 w-8 bg-primary rounded-md text-white flex items-center justify-center">
          <Layers className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
        
        <AnimatePresence>
          {open && (
            <motion.div 
              className="flex flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-semibold text-sm">Admin Panel</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-xs text-muted-foreground">LaunchPad</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ToggleButton = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen(!open)}
      className="absolute bottom-5 left-1/2 transform -translate-x-1/2 rounded-full border border-border bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center h-8 w-8"
    >
      <ChevronLeft 
        className={cn("h-4 w-4 text-primary transition-transform duration-300", !open && "rotate-180")} 
      />
    </motion.button>
  );
}; 