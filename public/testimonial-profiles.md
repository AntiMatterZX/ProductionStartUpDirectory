# Testimonial Profile Images

## Recommended Dimensions
Profile images should be **128x128px** square images, which will be displayed as circles in the UI.

## Image Sources & URLs Used
The landing page currently uses the following placeholder images from RandomUser.me:

1. **Sarah Johnson (Founder, TechNova)**
   - URL: `https://randomuser.me/api/portraits/women/44.jpg` 
   - Fallback: UI Avatars will generate "SJ" initials if the image fails to load

2. **Michael Chen (Partner, Horizon Ventures)**
   - URL: `https://randomuser.me/api/portraits/men/54.jpg`
   - Fallback: UI Avatars will generate "MC" initials if the image fails to load

3. **Rebecca Torres (CEO, HealthAI)**
   - URL: `https://randomuser.me/api/portraits/women/29.jpg`
   - Fallback: UI Avatars will generate "RT" initials if the image fails to load

## For Production Use
Replace these placeholder images with:
- Real testimonial photos (with permission)
- Professional headshots
- Company logos if appropriate

## Fallback System
The code includes a fallback system using UI Avatars:
```javascript
onError={(e) => {
  e.currentTarget.src = `https://ui-avatars.com/api/?name=${testimonial.author.replace(' ', '+')}&background=4F46E5&color=fff`
}}
``` 