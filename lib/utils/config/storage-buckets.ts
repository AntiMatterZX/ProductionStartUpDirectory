/**
 * Centralized storage bucket configuration for consistent usage across components
 */

export const STORAGE_BUCKETS = {
  // Main public bucket for all media types
  PUBLIC: "public",
}

/**
 * Helper function to get the appropriate bucket for a media type
 */
export function getBucketForMediaType(mediaType: string): string {
  // All media types use the same public bucket
  return STORAGE_BUCKETS.PUBLIC;
}

/**
 * Helper function to get the appropriate path for a file in storage
 */
export function getStoragePath(userId: string, mediaType: string, fileName: string): string {
  switch (mediaType) {
    case "logo":
      return `${userId}/logos/${fileName}`;
    case "image":
    case "coverImage":
      return `${userId}/images/${fileName}`;
    case "document":
    case "pitch_deck":
    case "pitchDeck":
      return `${userId}/documents/${fileName}`;
    case "video":
      return `${userId}/videos/${fileName}`;
    default:
      return `${userId}/other/${fileName}`;
  }
} 