import { z } from "zod"

// Basic Info Validation Schema
export const basicInfoSchema = z.object({
  name: z.string().min(2, { message: "Startup name must be at least 2 characters" }).max(100),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters" })
    .max(50)
    .regex(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens" }),
  tagline: z.string().max(150, { message: "Tagline must be 150 characters or less" }).optional(),
  industry: z.number({ message: "Please select an industry" }),
  foundingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date (YYYY-MM-DD)" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
})

// Detailed Info Validation Schema
export const detailedInfoSchema = z.object({
  description: z
    .string()
    .min(50, { message: "Description must be at least 50 characters" })
    .max(2000, { message: "Description must be 2000 characters or less" }),
  fundingStage: z.string().min(1, { message: "Please select a funding stage" }),
  fundingAmount: z.string().optional(),
  teamSize: z.string().min(1, { message: "Please select a team size" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  lookingFor: z.array(z.number()).min(1, { message: "Please select at least one option" }),
})

// Media Upload Validation Schema
export const mediaUploadSchema = z.object({
  logo: z.any().optional(),
  coverImage: z.any().optional(),
  pitchDeck: z.any().optional(),
  videoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialLinks: z.object({
    linkedin: z.string().url({ message: "Please enter a valid LinkedIn URL" }).optional().or(z.literal("")),
    twitter: z.string().url({ message: "Please enter a valid Twitter URL" }).optional().or(z.literal("")),
  }),
})

// Complete Startup Form Validation Schema
export const startupFormSchema = z.object({
  basicInfo: basicInfoSchema,
  detailedInfo: detailedInfoSchema,
  mediaInfo: mediaUploadSchema,
})

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>
export type DetailedInfoFormValues = z.infer<typeof detailedInfoSchema>
export type MediaUploadFormValues = z.infer<typeof mediaUploadSchema>
export type StartupFormValues = z.infer<typeof startupFormSchema>
