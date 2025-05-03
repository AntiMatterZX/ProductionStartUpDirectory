import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Upload, X } from "lucide-react";
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
  const supabase = createClientComponentClient();

  // Set default accepted file types based on media type
  useEffect(() => {
    if (!acceptedFileTypes) {
      switch (mediaType) {
        case "logo":
        case "image":
          acceptedFileTypes = "image/*";
          break;
        case "document":
        case "pitch_deck":
          acceptedFileTypes = ".pdf,.doc,.docx,.ppt,.pptx";
          break;
        case "video":
          acceptedFileTypes = "video/*";
          break;
      }
    }
  }, [mediaType, acceptedFileTypes]);

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
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Upload the file to Supabase storage
  const uploadFile = async () => {
    if (!selectedFile || !startupId) return;
    
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
      
      // Track upload progress manually
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update database: ${errorData.message}`);
      }
      
      // Complete
      toast({
        title: "Upload complete",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully.`,
      });
      
      setIsOpen(false);
      setSelectedFile(null);
      
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload {mediaType.charAt(0).toUpperCase() + mediaType.slice(1).replace("_", " ")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={handleFileChange} 
                accept={acceptedFileTypes}
                disabled={isUploading}
              />
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {isUploading && uploadProgress > 0 && (
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                if (onCancelled) onCancelled();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadFile} 
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 