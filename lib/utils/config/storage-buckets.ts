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
 * Media types for better organization and validation
 */
export const MEDIA_TYPES = {
  // Startup media types
  LOGO: "logo",
  COVER_IMAGE: "coverImage",
  IMAGE: "image",
  DOCUMENT: "document",
  PITCH_DECK: "pitchDeck",
  VIDEO: "video",
  
  // User media types
  AVATAR: "avatar",
  PROFILE: "profile",
}

/**
 * Helper function to get the appropriate bucket for a media type
 */
export function getBucketForMediaType(mediaType: string): string {
  // Normalize media type
  const type = normalizeMediaType(mediaType);
  
  // All startup media goes to the STARTUPS bucket
  if (type === MEDIA_TYPES.LOGO || 
      type === MEDIA_TYPES.IMAGE || 
      type === MEDIA_TYPES.COVER_IMAGE || 
      type === MEDIA_TYPES.DOCUMENT || 
      type === MEDIA_TYPES.PITCH_DECK || 
      type === MEDIA_TYPES.VIDEO) {
    return STORAGE_BUCKETS.STARTUPS;
  }
  
  // User media goes to the USERS bucket
  if (type === MEDIA_TYPES.AVATAR || type === MEDIA_TYPES.PROFILE) {
    return STORAGE_BUCKETS.USERS;
  }
  
  // Default to public bucket for other types
  return STORAGE_BUCKETS.PUBLIC;
}

/**
 * Helper function to get the appropriate path for a file in storage
 */
export function getStoragePath(userId: string, mediaType: string, fileName: string): string {
  // Normalize media type
  const type = normalizeMediaType(mediaType);
  
  switch (type) {
    case MEDIA_TYPES.LOGO:
      return `startups/${userId}/logos/${fileName}`;
    case MEDIA_TYPES.IMAGE:
    case MEDIA_TYPES.COVER_IMAGE:
      return `startups/${userId}/images/${fileName}`;
    case MEDIA_TYPES.DOCUMENT:
    case MEDIA_TYPES.PITCH_DECK:
      return `startups/${userId}/documents/${fileName}`;
    case MEDIA_TYPES.VIDEO:
      return `startups/${userId}/videos/${fileName}`;
    case MEDIA_TYPES.AVATAR:
    case MEDIA_TYPES.PROFILE:
      return `users/${userId}/profile/${fileName}`;
    default:
      return `startups/${userId}/other/${fileName}`;
  }
}

/**
 * Helper function to normalize media type strings
 */
export function normalizeMediaType(mediaType: string): string {
  // Handle common variations
  const type = mediaType.toLowerCase().trim();
  
  if (type === 'logo') {
    return MEDIA_TYPES.LOGO;
  }
  if (type === 'coverimage' || type === 'cover_image' || type === 'cover') {
    return MEDIA_TYPES.COVER_IMAGE;
  }
  if (type === 'image') {
    return MEDIA_TYPES.IMAGE;
  }
  if (type === 'document') {
    return MEDIA_TYPES.DOCUMENT;
  }
  if (type === 'pitchdeck' || type === 'pitch_deck') {
    return MEDIA_TYPES.PITCH_DECK;
  }
  if (type === 'video') {
    return MEDIA_TYPES.VIDEO;
  }
  if (type === 'avatar') {
    return MEDIA_TYPES.AVATAR;
  }
  if (type === 'profile') {
    return MEDIA_TYPES.PROFILE;
  }
  
  // Return original if no match
  return type;
} 