import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Heart, Rocket } from "lucide-react";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <div className="py-6">
        <h1 className="text-3xl font-bold">Investor Dashboard</h1>
        <p className="text-muted-foreground">Manage your startup investments and opportunities</p>
      </div>
      
      <div className="mb-8">
        <nav className="flex space-x-4 border-b">
          <Link 
            href="/dashboard/investor/opportunities" 
            className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Opportunities
          </Link>
          <Link 
            href="/dashboard/investor/wishlist" 
            className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary"
          >
            <Heart className="mr-2 h-4 w-4" />
            Wishlist
          </Link>
        </nav>
      </div>
      
      {children}
    </div>
  );
} 