import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, FileText, Video, LayoutTemplate, ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StartupMediaUpload from "@/app/components/StartupMediaUpload";
import MediaDeleteButton from "@/app/components/MediaDeleteButton";
import { Badge } from "@/components/ui/badge";

interface MediaDisplayProps {
  startupId: string;
  mediaImages: string[];
  mediaDocuments: string[];
  mediaVideos: string[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isEditing?: boolean;
  onMediaRemoved?: (mediaType: string, url: string) => void;
  onMediaAdded?: (mediaType: string, url: string) => void;
}

export default function StartupMediaDisplay({
  startupId,
  mediaImages = [],
  mediaDocuments = [],
  mediaVideos = [],
  logoUrl = null,
  bannerUrl = null,
  isEditing = false,
  onMediaRemoved,
  onMediaAdded
}: MediaDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Filter gallery images to exclude logo and banner
  const galleryImages = mediaImages.filter(img => img !== logoUrl && img !== bannerUrl);
  
  // Handle media deletion
  const handleDeleteMedia = (mediaType: string, url: string) => {
    if (onMediaRemoved) {
      onMediaRemoved(mediaType, url);
    }
    
    // Close image preview if it's the deleted image
    if (selectedImage === url) {
      setSelectedImage(null);
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
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="images" className="flex items-center">
              <Image className="h-4 w-4 mr-2" />
              Images ({galleryImages.length})
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents ({mediaDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Videos ({mediaVideos.length})
            </TabsTrigger>
          </TabsList>
          
          {isEditing && (
            <div className="flex gap-2">
              <TabsContent value="images" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="gallery"
                  buttonLabel="Add Gallery Image"
                  onUploaded={(url) => handleMediaUploaded("gallery", url)}
                />
              </TabsContent>
              
              <TabsContent value="branding" className="m-0 p-0 flex gap-2">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="logo"
                  buttonLabel="Upload Logo"
                  onUploaded={(url) => handleMediaUploaded("logo", url)}
                />
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="banner"
                  buttonLabel="Upload Banner"
                  onUploaded={(url) => handleMediaUploaded("banner", url)}
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
        
        {/* Branding Tab - Logo and Banner */}
        <TabsContent value="branding" className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Section */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Company Logo</h3>
                  <Badge variant="outline">Logo</Badge>
                </div>
                <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center p-2 mb-2">
                  {logoUrl ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img 
                        src={logoUrl} 
                        alt="Company Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                      
                      {isEditing && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MediaDeleteButton
                            startupId={startupId}
                            mediaType="logo"
                            mediaUrl={logoUrl}
                            onDelete={() => logoUrl && handleDeleteMedia("logo", logoUrl)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">No logo uploaded</p>
                      {isEditing && (
                        <StartupMediaUpload 
                          startupId={startupId}
                          mediaType="logo"
                          buttonLabel="Upload Logo"
                          onUploaded={(url) => handleMediaUploaded("logo", url)}
                        />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your logo represents your brand identity and appears throughout the platform.
                </p>
              </CardContent>
            </Card>
            
            {/* Banner Section */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Banner Image</h3>
                  <Badge variant="outline">Banner</Badge>
                </div>
                <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center p-2 mb-2">
                  {bannerUrl ? (
                    <div className="relative group w-full h-full">
                      <img 
                        src={bannerUrl} 
                        alt="Banner Image" 
                        className="w-full h-full object-cover"
                      />
                      
                      {isEditing && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MediaDeleteButton
                            startupId={startupId}
                            mediaType="banner"
                            mediaUrl={bannerUrl}
                            onDelete={() => bannerUrl && handleDeleteMedia("banner", bannerUrl)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">No banner uploaded</p>
                      {isEditing && (
                        <StartupMediaUpload 
                          startupId={startupId}
                          mediaType="banner"
                          buttonLabel="Upload Banner"
                          onUploaded={(url) => handleMediaUploaded("banner", url)}
                        />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  The banner image appears at the top of your startup profile page.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Gallery Images Tab */}
        <TabsContent value="images" className="mt-2">
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((url, index) => (
                <Card key={`image-${index}`} className="overflow-hidden">
                  <CardContent className="p-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full aspect-square bg-muted rounded-md overflow-hidden cursor-pointer relative group">
                          <img 
                            src={url} 
                            alt={`Gallery image ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          
                          {isEditing && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <MediaDeleteButton
                                startupId={startupId}
                                mediaType="gallery"
                                mediaUrl={url}
                                onDelete={() => handleDeleteMedia("gallery", url)}
                              />
                            </div>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] p-0">
                        <div className="relative w-full max-h-[80vh] overflow-auto">
                          <img 
                            src={url} 
                            alt={`Gallery image ${index + 1}`} 
                            className="w-full h-auto"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No gallery images available</p>
          )}
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-2">
          {mediaDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mediaDocuments.map((url, index) => (
                <Card key={`doc-${index}`} className="group relative">
                  <CardContent className="p-4 flex items-center">
                    <FileText className="h-10 w-10 text-muted-foreground mr-4" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-medium truncate">Document {index + 1}</h4>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate block"
                      >
                        View Document
                      </a>
                    </div>
                    
                    {isEditing && (
                      <MediaDeleteButton
                        startupId={startupId}
                        mediaType="document"
                        mediaUrl={url}
                        onDelete={() => handleDeleteMedia("document", url)}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No documents available</p>
          )}
        </TabsContent>
        
        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-2">
          {mediaVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {mediaVideos.map((url, index) => (
                <Card key={`video-${index}`} className="group relative">
                  <CardContent className="p-4">
                    <div className="aspect-video overflow-hidden rounded bg-muted mb-2">
                      {url.includes('youtube.com') || url.includes('youtu.be') ? (
                        <iframe
                          src={url.replace('watch?v=', 'embed/')}
                          title={`Video ${index + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      ) : (
                        <video 
                          src={url} 
                          controls
                          className="w-full h-full object-contain"
                        ></video>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="flex justify-end">
                        <MediaDeleteButton
                          startupId={startupId}
                          mediaType="video"
                          mediaUrl={url}
                          onDelete={() => handleDeleteMedia("video", url)}
                        />
                      </div>
                    )}
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