"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./swagger.module.css"

export default function ApiDocsPage() {
  const swaggerUIRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Add the Swagger UI stylesheet
    const linkElement = document.createElement('link')
    linkElement.rel = 'stylesheet'
    linkElement.href = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css'
    document.head.appendChild(linkElement)

    const initializeSwaggerUI = async () => {
      try {
        // Dynamically import SwaggerUI from dist package
        const SwaggerUIBundle = (await import("swagger-ui-dist")).default
        
        // Initialize SwaggerUI
        if (swaggerUIRef.current) {
          SwaggerUIBundle({
            dom_id: "#swagger-ui",
            url: "/api/swagger",
            docExpansion: "list",
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
            supportedSubmitMethods: ["get", "post", "put", "delete"],
          })
        }
      } catch (error) {
        console.error("Failed to initialize Swagger UI:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSwaggerUI()

    // Clean up
    return () => {
      document.head.removeChild(linkElement)
    }
  }, [])

  return (
    <div className={styles.swaggerUIContainer}>
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-4">LaunchPad API Documentation</h1>
        <p className="text-muted-foreground mb-8">
          Explore the LaunchPad API endpoints and learn how to integrate with our platform.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div id="swagger-ui" ref={swaggerUIRef} />
      )}
    </div>
  )
} 