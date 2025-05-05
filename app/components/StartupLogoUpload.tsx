import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Upload, Image, X } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase/client-component";
import { uploadFile } from "@/lib/utils/helpers/file-upload";
import { STORAGE_BUCKETS } from "@/lib/utils/config/storage-buckets";

interface LogoUploadProps {
  startupId: string;
  userId: string;
  currentLogoUrl?: string | null;
  onUploaded?: (url: string) => void;
  buttonText?: string;
  className?: string;
}

export default function StartupLogoUpload({
  startupId,
  userId,
  currentLogoUrl,
  onUploaded,
  buttonText = "Upload Logo",
  className = ""
}: LogoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset error state
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo image must be less than 2MB");
        toast({
          title: "File too large",
          description: "Logo image must be less than 2MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clean up preview URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  // Upload logo
  const handleUpload = async () => {
    if (!selectedFile || !startupId || !userId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload file to storage
      const fileUrl = await uploadFile(
        selectedFile, 
        userId, 
        'logo',
        (progress) => setUploadProgress(progress)
      );
      
      // Update startup record with new logo_url
      const { error } = await supabase
        .from('startups')
        .update({ logo_image: fileUrl })
        .eq('id', startupId);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update success
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast({
        title: "Logo updated",
        description: "Your company logo has been updated successfully"
      });
      
      if (onUploaded) {
        onUploaded(fileUrl);
      }
      
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setError(error.message);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong uploading your logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const resetForm = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Company Logo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-muted rounded-md overflow-hidden mb-4 flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                ) : currentLogoUrl ? (
                  <img 
                    src={currentLogoUrl} 
                    alt="Current logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image className="h-12 w-12 text-muted-foreground/50" />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="logo-file" className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  {previewUrl ? "Change" : "Select"} Logo
                </Label>
                
                {previewUrl && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
                
                <Input
                  id="logo-file"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <p className="font-medium">Upload Error</p>
                <p>{error}</p>
                <p className="mt-2 text-xs">
                  Please try again or contact support if the problem persists.
                </p>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Recommended logo format:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Square format (1:1 ratio)</li>
                <li>PNG or SVG with transparent background</li>
                <li>Minimum 512x512 pixels</li>
                <li>Maximum size: 2MB</li>
              </ul>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-muted-foreground">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 