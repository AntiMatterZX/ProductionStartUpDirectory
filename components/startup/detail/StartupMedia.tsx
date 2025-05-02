import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { StartupMedia } from "@/types/startup"

interface StartupMediaProps {
  media?: StartupMedia[]
  videoUrl?: string
}

export default function StartupMedia({ media, videoUrl }: StartupMediaProps) {
  const pitchDeck = media?.find((m) => m.media_type === "document")

  if (!media?.length && !videoUrl) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Embed */}
        {videoUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Demo Video</h3>
            <div className="aspect-video rounded-md overflow-hidden bg-muted">
              <iframe
                src={getEmbedUrl(videoUrl)}
                className="w-full h-full"
                allowFullScreen
                title="Startup Demo Video"
              ></iframe>
            </div>
          </div>
        )}

        {/* Pitch Deck */}
        {pitchDeck && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pitch Deck</h3>
            <div className="flex items-center gap-2 p-3 rounded-md border">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate">Pitch Deck</span>
              <Button variant="outline" size="sm" asChild>
                <a href={pitchDeck.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Gallery */}
        {media?.filter((m) => m.media_type === "image" && !m.is_featured).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {media
                ?.filter((m) => m.media_type === "image" && !m.is_featured)
                .map((image) => (
                  <div key={image.id} className="aspect-square rounded-md overflow-hidden">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.title || "Startup image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to convert YouTube or Vimeo URLs to embed URLs
function getEmbedUrl(url: string): string {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const youtubeMatch = url.match(youtubeRegex)

  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo
  const vimeoRegex =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?))/
  const vimeoMatch = url.match(vimeoRegex)

  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // Return original URL if no match
  return url
}
