import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, FileText, Video, X, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import StartupMediaUpload from "@/app/components/StartupMediaUpload";

interface MediaDisplayProps {
  startupId: string;
  mediaImages: string[];
  mediaDocuments: string[];
  mediaVideos: string[];
  isEditing?: boolean;
  onMediaRemoved?: (mediaType: string, url: string) => void;
  onMediaAdded?: (mediaType: string, url: string) => void;
}

export default function StartupMediaDisplay({
  startupId,
  mediaImages = [],
  mediaDocuments = [],
  mediaVideos = [],
  isEditing = false,
  onMediaRemoved,
  onMediaAdded
}: MediaDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle media deletion
  const handleDeleteMedia = async (mediaType: string, url: string) => {
    if (!startupId || !url) return;
    
    try {
      setIsDeleting(true);
      
      // Call the API to delete the media
      const response = await fetch(`/api/startups/${startupId}/media`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaType,
          url,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete media");
      }
      
      // Notify parent component
      if (onMediaRemoved) {
        onMediaRemoved(mediaType, url);
      }
      
      toast({
        title: "Media deleted",
        description: "The file has been removed successfully.",
      });
      
      // Close image preview if it's the deleted image
      if (selectedImage === url) {
        setSelectedImage(null);
      }
      
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "There was a problem deleting the media.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle media upload
  const handleMediaUploaded = (mediaType: string, url: string) => {
    if (onMediaAdded) {
      onMediaAdded(mediaType, url);
    }
    
    toast({
      title: "Upload successful",
      description: "New media has been added to your startup.",
    });
  };
  
  return (
    <div className="w-full">
      <Tabs defaultValue="images" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="images" className="flex items-center justify-center">
              <Image className="h-4 w-4 mr-2 hidden sm:inline" />
              <span className="truncate">Images ({mediaImages.length})</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center justify-center">
              <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
              <span className="truncate">Docs ({mediaDocuments.length})</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center justify-center">
              <Video className="h-4 w-4 mr-2 hidden sm:inline" />
              <span className="truncate">Videos ({mediaVideos.length})</span>
            </TabsTrigger>
          </TabsList>
          
          {isEditing && (
            <div className="flex gap-2 justify-end">
              <TabsContent value="images" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="image"
                  buttonLabel="Add Image"
                  onUploaded={(url) => handleMediaUploaded("image", url)}
                />
              </TabsContent>
              
              <TabsContent value="documents" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="document"
                  buttonLabel="Add Document"
                  onUploaded={(url) => handleMediaUploaded("document", url)}
                />
              </TabsContent>
              
              <TabsContent value="videos" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="video"
                  buttonLabel="Add Video"
                  onUploaded={(url) => handleMediaUploaded("video", url)}
                />
              </TabsContent>
            </div>
          )}
        </div>
        
        <TabsContent value="images" className="mt-2">
          {mediaImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mediaImages.map((url, index) => (
                <Card key={`image-${index}`} className="overflow-hidden">
                  <CardContent className="p-0 relative group">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer w-full h-40 relative">
                          <img 
                            src={url} 
                            alt={`Startup image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-0 sm:max-w-[90vw] max-h-[90vh]">
                        <div className="relative">
                          <img 
                            src={url} 
                            alt={`Startup image ${index + 1}`}
                            className="w-full h-auto max-h-[80vh] object-contain"
                          />
                          <DialogClose className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-full">
                            <X className="h-4 w-4" />
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteMedia("image", url)}
                        disabled={isDeleting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No images available</p>
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="mt-2">
          {mediaDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mediaDocuments.map((url, index) => (
                <Card key={`doc-${index}`} className="group relative">
                  <CardContent className="p-4 flex items-center">
                    <FileText className="h-10 w-10 text-muted-foreground mr-4 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-medium truncate">Document {index + 1}</h4>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate flex items-center gap-1 mt-1"
                      >
                        <span>View Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMedia("document", url)}
                        disabled={isDeleting}
                        className="ml-2 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No documents available</p>
          )}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-2">
          {mediaVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {mediaVideos.map((url, index) => (
                <Card key={`video-${index}`} className="group relative">
                  <CardContent className="p-4">
                    <div className="aspect-video overflow-hidden rounded bg-muted mb-2 relative">
                      {url.includes('youtube.com') || url.includes('youtu.be') ? (
                        <iframe
                          src={url.replace('watch?v=', 'embed/')}
                          title={`Video ${index + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          loading="lazy"
                        ></iframe>
                      ) : (
                        <video 
                          src={url} 
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        ></video>
                      )}
                      
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteMedia("video", url)}
                          disabled={isDeleting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <h4 className="font-medium">Video {index + 1}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No videos available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 