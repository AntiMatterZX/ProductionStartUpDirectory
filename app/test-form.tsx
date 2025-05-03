"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function TestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setError(null);
    
    try {
      // Create a simple test FormData
      const formData = new FormData();
      
      // Add basic info
      const basicInfo = {
        name: "Test Startup " + Date.now(),
        tagline: "This is a test startup",
        websiteUrl: "https://example.com",
        categoryId: 1,
      };
      
      // Add detailed info
      const detailedInfo = {
        description: "This is a test description for the startup",
        teamSize: "5",
        fundingStage: "Seed",
        fundingAmount: "100000",
        location: "San Francisco, CA",
        lookingFor: [1, 2, 3]
      };
      
      // Add media info
      const mediaInfo = {
        videoUrl: "https://youtube.com/watch?v=test",
        socialLinks: {
          linkedin: "https://linkedin.com/in/test",
          twitter: "https://twitter.com/test"
        }
      };
      
      // Append JSON strings to FormData
      formData.append("basicInfo", JSON.stringify(basicInfo));
      formData.append("detailedInfo", JSON.stringify(detailedInfo));
      formData.append("mediaInfo", JSON.stringify(mediaInfo));
      
      // Log what we're sending
      console.log("Sending test form data:", {
        basicInfo,
        detailedInfo,
        mediaInfo
      });
      
      // Send the request
      const response = await fetch("/api/startups", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      console.log("Response received:", data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || "Error creating startup");
      }
      
      setResult(JSON.stringify(data, null, 2));
      toast({
        title: "Success",
        description: "Startup created successfully!"
      });
    } catch (error: any) {
      console.error("Error in test form:", error);
      setError(error.message || "Unknown error");
      setResult(null);
      toast({
        title: "Error",
        description: error.message || "Failed to create startup",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Test Startup Creation Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-4">
            This form submits a pre-filled startup creation request to test the API.
          </p>
        </div>
        
        <button 
          type="submit" 
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Create Test Startup"}
        </button>
      </form>
      
      {error && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2 text-red-600">Error:</h3>
          <div className="bg-red-50 p-4 rounded-md overflow-auto max-h-80 border border-red-200">
            <pre className="text-sm text-red-800">{error}</pre>
          </div>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2 text-green-600">Success:</h3>
          <div className="bg-green-50 p-4 rounded-md overflow-auto max-h-80 border border-green-200">
            <pre className="text-sm text-green-800">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 