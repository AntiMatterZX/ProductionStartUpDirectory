/**
 * Centralized storage bucket configuration for consistent usage across components
 */

export const STORAGE_BUCKETS = {
  // Main bucket for startup-related media
  STARTUPS: "startups",
  // For user profile pictures and related content
  USERS: "users",
  // For system-wide assets
  PUBLIC: "public",
}

/**
 * Helper function to get the appropriate bucket for a media type
 */
export function getBucketForMediaType(mediaType: string): string {
  // All startup media goes to the STARTUPS bucket
  if (mediaType === "logo" || 
      mediaType === "image" || 
      mediaType === "coverImage" || 
      mediaType === "document" || 
      mediaType === "pitch_deck" || 
      mediaType === "pitchDeck" || 
      mediaType === "video") {
    return STORAGE_BUCKETS.STARTUPS;
  }
  
  // Default to public bucket for other types
  return STORAGE_BUCKETS.PUBLIC;
}

/**
 * Helper function to get the appropriate path for a file in storage
 */
export function getStoragePath(userId: string, mediaType: string, fileName: string): string {
  switch (mediaType) {
    case "logo":
      return `startups/${userId}/logos/${fileName}`;
    case "image":
    case "coverImage":
      return `startups/${userId}/images/${fileName}`;
    case "document":
    case "pitch_deck":
    case "pitchDeck":
      return `startups/${userId}/documents/${fileName}`;
    case "video":
      return `startups/${userId}/videos/${fileName}`;
    default:
      return `startups/${userId}/other/${fileName}`;
  }
} 