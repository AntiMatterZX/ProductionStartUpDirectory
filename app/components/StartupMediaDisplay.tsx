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
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="images" className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <TabsList className="h-9">
            <TabsTrigger value="images" className="flex items-center text-xs px-2 py-1 h-7">
              <Image className="h-3 w-3 mr-1" />
              Images ({galleryImages.length})
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center text-xs px-2 py-1 h-7">
              <LayoutTemplate className="h-3 w-3 mr-1" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center text-xs px-2 py-1 h-7">
              <FileText className="h-3 w-3 mr-1" />
              Docs ({mediaDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center text-xs px-2 py-1 h-7">
              <Video className="h-3 w-3 mr-1" />
              Videos ({mediaVideos.length})
            </TabsTrigger>
          </TabsList>
          
          {isEditing && (
            <div className="flex gap-2">
              <TabsContent value="images" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="gallery"
                  buttonLabel="Add Image"
                  buttonSize="sm"
                  onUploaded={(url) => handleMediaUploaded("gallery", url)}
                />
              </TabsContent>
              
              <TabsContent value="branding" className="m-0 p-0 flex gap-2">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="logo"
                  buttonLabel="Logo"
                  buttonSize="sm"
                  onUploaded={(url) => handleMediaUploaded("logo", url)}
                />
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="banner"
                  buttonLabel="Banner"
                  buttonSize="sm"
                  onUploaded={(url) => handleMediaUploaded("banner", url)}
                />
              </TabsContent>
              
              <TabsContent value="documents" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="document"
                  buttonLabel="Add Doc"
                  buttonSize="sm"
                  onUploaded={(url) => handleMediaUploaded("document", url)}
                />
              </TabsContent>
              
              <TabsContent value="videos" className="m-0 p-0">
                <StartupMediaUpload 
                  startupId={startupId}
                  mediaType="video"
                  buttonLabel="Add Video"
                  buttonSize="sm"
                  onUploaded={(url) => handleMediaUploaded("video", url)}
                />
              </TabsContent>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Branding Tab - Logo and Banner */}
          <TabsContent value="branding" className="h-full overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Logo Section */}
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Company Logo</h3>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-5">Logo</Badge>
                  </div>
                  <div className="w-full h-36 bg-muted rounded-md flex items-center justify-center p-2 mb-2">
                    {logoUrl ? (
                      <div className="relative group w-full h-full flex items-center justify-center">
                        <img 
                          src={logoUrl} 
                          alt="Company Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                        
                        {isEditing && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MediaDeleteButton
                              startupId={startupId}
                              mediaType="logo"
                              mediaUrl={logoUrl}
                              onDelete={() => logoUrl && handleDeleteMedia("logo", logoUrl)}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Image className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-xs">No logo uploaded</p>
                        {isEditing && (
                          <StartupMediaUpload 
                            startupId={startupId}
                            mediaType="logo"
                            buttonLabel="Upload Logo"
                            buttonSize="sm"
                            onUploaded={(url) => handleMediaUploaded("logo", url)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logo appears throughout the platform
                  </p>
                </CardContent>
              </Card>
              
              {/* Banner Section */}
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Banner Image</h3>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-5">Banner</Badge>
                  </div>
                  <div className="w-full h-36 bg-muted rounded-md flex items-center justify-center p-2 mb-2">
                    {bannerUrl ? (
                      <div className="relative group w-full h-full">
                        <img 
                          src={bannerUrl} 
                          alt="Banner Image" 
                          className="w-full h-full object-cover"
                        />
                        
                        {isEditing && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MediaDeleteButton
                              startupId={startupId}
                              mediaType="banner"
                              mediaUrl={bannerUrl}
                              onDelete={() => bannerUrl && handleDeleteMedia("banner", bannerUrl)}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <LayoutTemplate className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-xs">No banner uploaded</p>
                        {isEditing && (
                          <StartupMediaUpload 
                            startupId={startupId}
                            mediaType="banner"
                            buttonLabel="Upload Banner"
                            buttonSize="sm"
                            onUploaded={(url) => handleMediaUploaded("banner", url)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Appears at the top of your profile
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Gallery Images Tab */}
          <TabsContent value="images" className="h-full overflow-auto">
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <MediaDeleteButton
                                  startupId={startupId}
                                  mediaType="gallery"
                                  mediaUrl={url}
                                  onDelete={() => handleDeleteMedia("gallery", url)}
                                  size="sm"
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
              <p className="text-muted-foreground text-center py-8 text-sm">No gallery images available</p>
            )}
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="h-full overflow-auto">
            {mediaDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediaDocuments.map((url, index) => (
                  <Card key={`doc-${index}`} className="group relative">
                    <CardContent className="p-3 flex items-center">
                      <FileText className="h-8 w-8 text-muted-foreground mr-3" />
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-medium truncate">Document {index + 1}</h4>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block"
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
                          size="sm"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No documents available</p>
            )}
          </TabsContent>
          
          {/* Videos Tab */}
          <TabsContent value="videos" className="h-full overflow-auto">
            {mediaVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {mediaVideos.map((url, index) => (
                  <Card key={`video-${index}`} className="group relative">
                    <CardContent className="p-3">
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
                            size="sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No videos available</p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 