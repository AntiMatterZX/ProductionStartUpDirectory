import { CalendarIcon, MapPinIcon } from "lucide-react"
import { MotionDiv, MotionImg } from "@/components/ui/motion"

interface StartupHeaderProps {
  name: string
  logo?: string | null
  coverImage?: string | null
  category?: string
  foundingYear?: number
  location?: string | null
}

export default function StartupHeader({
  name,
  logo,
  coverImage,
  category,
  foundingYear,
  location,
}: StartupHeaderProps) {
  return (
    <div className="relative">
      {/* Cover Image */}
      <MotionDiv
        className="h-64 w-full bg-gradient-to-r from-blue-600/20 to-indigo-600/10 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {coverImage && (
          <MotionImg
            src={coverImage || "/placeholder.svg"}
            alt={`${name} cover`}
            className="w-full h-full object-cover absolute inset-0 mix-blend-overlay"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2 }}
          />
        )}
      </MotionDiv>

      {/* Startup Info */}
      <div className="container relative -mt-16">
        <div className="bg-background rounded-lg shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Logo */}
          <MotionDiv
            className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-background shadow-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {logo ? (
              <img src={logo || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary">{name.charAt(0)}</span>
            )}
          </MotionDiv>

          {/* Name and Basic Info */}
          <MotionDiv
            className="flex-1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h1 className="text-3xl font-bold">{name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {category && <span className="bg-primary/10 px-2 py-1 rounded-md">{category}</span>}

              {foundingYear && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Founded {foundingYear}
                </span>
              )}

              {location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {location}
                </span>
              )}
            </div>
          </MotionDiv>
        </div>
      </div>
    </div>
  )
}
