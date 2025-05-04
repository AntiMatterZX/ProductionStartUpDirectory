import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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

/**
 * Props for the MediaDeleteButton component
 * @typedef {Object} MediaDeleteButtonProps
 * @property {string} startupId - ID of the startup that owns the media
 * @property {string} mediaType - Type of media being deleted
 * @property {string} mediaUrl - URL of the media to delete
 * @property {Function} [onDelete] - Callback function to execute after successful deletion
 * @property {"sm" | "default" | "lg" | "icon"} [size="sm"] - Size of the delete button
 * @property {"default" | "destructive" | "outline" | "ghost" | "link"} [variant="outline"] - Visual style of the button
 * @property {boolean} [isAdmin=false] - Whether this delete action is performed by an admin user
 * @property {string} [buttonText] - Optional text to display on the button (if not provided, only the icon is shown)
 * @property {string} [confirmationText] - Custom text for the confirmation dialog
 */
interface MediaDeleteButtonProps {
  startupId: string;
  mediaType: "logo" | "banner" | "image" | "gallery" | "document" | "pitch_deck" | "video";
  mediaUrl: string;
  onDelete?: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  isAdmin?: boolean;
  buttonText?: string;
  confirmationText?: string;
}

/**
 * A reusable button component for deleting media files from startups
 * 
 * This component handles the UI for confirming deletion and makes the API call
 * to delete the media from both the database and storage.
 * 
 * @example
 * // Basic usage
 * <MediaDeleteButton
 *   startupId="123"
 *   mediaType="image"
 *   mediaUrl="https://example.com/image.jpg"
 *   onDelete={() => setImages(images.filter(img => img !== url))}
 * />
 * 
 * @example
 * // Admin usage with custom text
 * <MediaDeleteButton
 *   startupId="123"
 *   mediaType="document"
 *   mediaUrl="https://example.com/doc.pdf"
 *   isAdmin={true}
 *   buttonText="Remove Document"
 *   variant="destructive"
 *   size="default"
 * />
 */
export default function MediaDeleteButton({
  startupId,
  mediaType,
  mediaUrl,
  onDelete,
  size = "sm",
  variant = "outline",
  isAdmin = false,
  buttonText,
  confirmationText
}: MediaDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the deletion process by calling the media deletion API
   */
  const handleDelete = async () => {
    try {
      setError(null);
      setIsDeleting(true);
      
      // Build the query string
      const params = new URLSearchParams({
        startupId,
        mediaType,
        mediaUrl
      });
      
      // Add admin flag if the delete is being performed by an admin
      if (isAdmin) {
        params.append("isAdmin", "true");
      }
      
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
      setError(error instanceof Error ? error.message : "Failed to delete media");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Gets a human-readable label for the media type
   * @returns {string} The display name for the media type
   */
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
          className={`${!buttonText ? "text-destructive hover:bg-destructive hover:text-destructive-foreground" : ""} ${isAdmin ? "gap-1" : ""}`}
        >
          <Trash2 className={`h-4 w-4 ${buttonText ? "mr-2" : ""}`} />
          {buttonText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {getMediaLabel()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmationText || `Are you sure you want to delete this ${getMediaLabel()}? This action cannot be undone.`}
            {isAdmin && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-600 dark:text-amber-400 text-sm">
                You are deleting this {getMediaLabel()} as an administrator. This will affect the startup's profile immediately.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-3">
            {error}
          </div>
        )}
        
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