import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, FileText, ImageIcon, FileVideo, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/utils/helpers/file-upload";

interface UploadProps {
  startupId: string;
  userId: string;
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
  userId,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine accepted files based on media type if not provided
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

  // Get the appropriate icon for the media type
  const getIcon = () => {
    switch (mediaType) {
      case "logo":
      case "image":
        return <ImageIcon className="h-4 w-4 mr-2" />;
      case "video":
        return <FileVideo className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous errors and preview
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Maximum file size is ${maxSizeMB}MB`);
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }
    }
  };

  // Upload the file to Supabase storage
  const uploadMedia = async () => {
    if (!selectedFile || !startupId || !userId) {
      setError("Missing required information");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Use the centralized file upload utility with progress callback
      const fileUrl = await uploadFile(
        selectedFile,
        userId,
        mediaType,
        (progress) => setUploadProgress(progress)
      );
      
      // Save the URL to the database using the media API
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
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1).replace("_", " ")} uploaded successfully.`,
      });
      
      setIsOpen(false);
      
      // Notify parent component if callback provided
      if (onUploaded) {
        onUploaded(fileUrl);
      }
      
    } catch (error: any) {
      console.error("Media upload error:", error);
      setError(error.message || "There was a problem uploading your file.");
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      resetForm();
      if (onCancelled) onCancelled();
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="gap-2">
        {getIcon()}
        {buttonLabel}
      </Button>
      
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!isUploading) {
            setIsOpen(open);
            if (!open) resetForm();
          } else if (!open) {
            // Prevent closing during upload
            setIsOpen(true);
            toast({
              title: "Upload in progress",
              description: "Please wait for the upload to complete or cancel it.",
              variant: "default",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {mediaType.charAt(0).toUpperCase() + mediaType.slice(1).replace("_", " ")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="w-full rounded-md overflow-hidden border-2 border-dashed border-muted-foreground/25 p-2 flex justify-center bg-muted/20">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 object-contain"
                />
              </div>
            )}
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload" 
                ref={fileInputRef}
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
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {error && (
              <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={uploadMedia}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 