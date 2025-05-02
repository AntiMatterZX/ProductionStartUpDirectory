# VentureConnect Landing Page Image Guidelines

This document outlines all image assets needed for the landing page, their dimensions, and placement.

## Primary Assets

### 1. Dashboard Preview
- **File**: `/dashboard-preview.png`
- **Dimensions**: 1200×700px
- **Location**: Hero section
- **Purpose**: Showcase the platform's dashboard interface
- **Placeholder URL**: `https://placehold.co/1200x700/4f46e5/ffffff?text=VentureConnect+Dashboard`

### 2. Matching Interface Preview
- **File**: `/matching-preview.png`
- **Dimensions**: 600×400px
- **Location**: "Why Choose Us" section
- **Purpose**: Illustrate the startup-investor matching functionality
- **Placeholder URL**: `https://placehold.co/600x400/4f46e5/ffffff?text=Smart+Matching`

### 3. Grid Pattern
- **File**: `/grid-pattern.svg`
- **Dimensions**: 100×100px (tiling SVG)
- **Location**: Used as background pattern in CTA section
- **Purpose**: Add visual texture to gradient backgrounds

## Testimonial Profile Images

All profile images should be square format, ideally 128×128px.

1. **Sarah Johnson**
   - Currently using: `https://randomuser.me/api/portraits/women/44.jpg`
   - Replace with actual testimonial photo

2. **Michael Chen**
   - Currently using: `https://randomuser.me/api/portraits/men/54.jpg`
   - Replace with actual testimonial photo

3. **Rebecca Torres**
   - Currently using: `https://randomuser.me/api/portraits/women/29.jpg`
   - Replace with actual testimonial photo

## SVG Icons

The landing page uses Lucide icons throughout:
- ArrowRight - Navigation and CTA buttons
- Users - Features section
- Rocket - Features section
- ShieldCheck - Features section
- TrendingUp - Features section
- CheckCircle2 - Feature list items

## Visual Guidelines

### Image Style Guidelines
1. **Dashboard & Interface Screenshots**
   - Clean, modern UI with ample whitespace
   - Use the brand's color palette
   - Include realistic but not personally identifiable data
   - Show actual product features when possible

2. **Profile Photos**
   - Professional headshots preferred
   - Square format (displayed as circles)
   - Good lighting with neutral backgrounds
   - Approx. 60% of the frame should be the person's face

### Color Palette
Align images with the platform's color scheme:
- Primary: `#4f46e5` (Indigo)
- Secondary accents: `#6366f1` (slightly lighter indigo)
- Background gradients: Indigo to violet transitions

## Loading & Fallbacks

All images have fallback mechanisms:
```javascript
onError={(e) => {
  e.currentTarget.src = "https://placehold.co/1200x700/4f46e5/ffffff?text=VentureConnect+Dashboard"
}}
```

## Additional Notes

1. **Image Optimization**
   - Compress all images appropriately
   - Consider using Next.js Image component for production
   - Use WebP format where supported

2. **Accessibility**
   - Ensure all images have appropriate alt text
   - Decorative elements should have empty alt attributes

3. **Responsive Behavior**
   - Images scale appropriately on different screen sizes
   - Consider art direction changes for mobile layouts 