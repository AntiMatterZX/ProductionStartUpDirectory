import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase/client-component";

interface UploadProps {
  startupId: string;
  mediaType: "logo" | "image" | "document" | "pitch_deck" | "video";
  onUploaded?: (url: string) => void;
  onCancelled?: () => void;
  buttonLabel?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  acceptedFileTypes?: string;
}

export default function StartupMediaUpload({
  startupId,
  mediaType,
  onUploaded,
  onCancelled,
  buttonLabel = "Upload File",
  multiple = false,
  maxSizeMB = 10,
  acceptedFileTypes = "",
}: UploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  // Determine accepted file types
  const getAcceptedFileTypes = () => {
    if (acceptedFileTypes) return acceptedFileTypes;
    
    switch (mediaType) {
      case "logo":
      case "image":
        return "image/*";
      case "document":
      case "pitch_deck":
        return ".pdf,.doc,.docx,.ppt,.pptx";
      case "video":
        return "video/*";
      default:
        return "";
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        });
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Upload the file to Supabase storage
  const uploadFile = async () => {
    if (!selectedFile || !startupId) {
      toast({
        title: "Error",
        description: "No file selected or startup ID missing",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Choose bucket based on media type
      let bucketName = "startup-media";
      let filePath = "";
      
      if (mediaType === "logo" || mediaType === "image") {
        bucketName = "startup-images";
        filePath = `${startupId}/${mediaType === "logo" ? "logo" : "images"}/${fileName}`;
      } else if (mediaType === "document" || mediaType === "pitch_deck") {
        bucketName = "startup-documents";
        filePath = `${startupId}/${mediaType === "pitch_deck" ? "pitch-deck" : "documents"}/${fileName}`;
      } else if (mediaType === "video") {
        bucketName = "startup-videos";
        filePath = `${startupId}/videos/${fileName}`;
      }
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      // Track upload progress manually (since we can't easily do this with Supabase)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
        }
        setUploadProgress(progress);
      }, 100);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      const fileUrl = publicUrlData.publicUrl;
      
      // Save the URL to the database using the updated API
      const response = await fetch(`/api/startups/${startupId}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaType: mediaType,
          url: fileUrl,
          title: selectedFile.name,
        }),
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update database: ${errorData.message}`);
      }
      
      // Complete
      toast({
        title: "Upload complete",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully.`,
      });
      
      // Reset state
      setIsOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Notify parent component if callback provided
      if (onUploaded) {
        onUploaded(fileUrl);
      }
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your file.",
        variant: "destructive",
      });
      
      // Reset progress
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close/cancel
  const handleClose = () => {
    if (isUploading) {
      toast({
        title: "Upload in progress",
        description: "Please wait for the upload to complete or try again later.",
        variant: "destructive",
      });
      return;
    }
    
    setIsOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (onCancelled) {
      onCancelled();
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>
              Upload {mediaType.charAt(0).toUpperCase() + mediaType.slice(1).replace("_", " ")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload" 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange} 
                accept={getAcceptedFileTypes()}
                disabled={isUploading}
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Maximum size: {maxSizeMB}MB</p>
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={isUploading}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
              className="sm:order-1 order-2 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadFile} 
              disabled={!selectedFile || isUploading}
              className="sm:order-2 order-1 w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 