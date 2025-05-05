export interface StartupMedia {
  id: string
  startup_id: string
  media_type: string
  url: string
  title: string | null
  description: string | null
  is_featured: boolean
  created_at: string
  updated_at: string | null
}

export interface SocialLink {
  id: string
  startup_id: string
  platform: string
  url: string
  created_at: string
  updated_at: string | null
}

export interface LookingForOption {
  id: number
  name: string
}

export interface Startup {
  id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  logo_image: string | null
  banner_image: string | null
  founding_date: string | null
  employee_count: number | null
  funding_stage: string | null
  funding_amount: number | null
  location: string | null
  category_id: number | null
  user_id: string
  status: string
  created_at: string
  updated_at: string | null
  categories?: {
    id: number
    name: string
    slug: string
  }
  startup_media?: StartupMedia[]
  social_links?: SocialLink[]
  looking_for?: LookingForOption[]
  votes?: {
    upvotes: number
    downvotes: number
  }
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  tagline?: string | null
  media_images?: string[]
}

export interface StartupFormData {
  basicInfo: StartupBasicInfo
  detailedInfo: StartupDetailedInfo
  mediaInfo: StartupMediaInfo
}

export interface StartupBasicInfo {
  name: string
  slug: string
  tagline: string
  industry: number
  foundingDate: string
  website: string
}

export interface StartupDetailedInfo {
  description: string
  fundingStage: string
  fundingAmount: string
  teamSize: string
  location: string
  lookingFor: number[]
}

export interface StartupMediaInfo {
  logo: File | null | undefined
  banner: File | null | undefined
  gallery: File[] | undefined
  pitchDeck: File | null | undefined
  videoUrl: string
  socialLinks: {
    linkedin: string
    twitter: string
  }
}
