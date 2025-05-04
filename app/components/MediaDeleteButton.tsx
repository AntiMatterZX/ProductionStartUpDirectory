import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

interface MediaDeleteButtonProps {
  startupId: string;
  mediaType: "logo" | "banner" | "image" | "gallery" | "document" | "pitch_deck" | "video";
  mediaUrl: string;
  onDelete?: () => void;
  size?: "sm" | "default";
  variant?: "default" | "destructive" | "outline" | "ghost";
}

export default function MediaDeleteButton({
  startupId,
  mediaType,
  mediaUrl,
  onDelete,
  size = "sm",
  variant = "outline"
}: MediaDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Build the query string
      const params = new URLSearchParams({
        startupId,
        mediaType,
        mediaUrl
      });
      
      // Call the API to delete the media
      const response = await fetch(`/api/startups/media?${params.toString()}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete media");
      }
      
      // Show success message
      toast({
        title: "Media deleted",
        description: "The media item was successfully deleted"
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getMediaLabel = () => {
    switch (mediaType) {
      case "logo": return "logo";
      case "banner": return "banner image";
      case "image":
      case "gallery": return "image";
      case "document": return "document";
      case "pitch_deck": return "pitch deck";
      case "video": return "video";
      default: return "media item";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {getMediaLabel()}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {getMediaLabel()}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 