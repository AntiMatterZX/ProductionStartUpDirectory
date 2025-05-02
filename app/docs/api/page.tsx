"use client"

import { useEffect, useState } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="swagger-wrapper">
      <style jsx global>{`
        .swagger-ui .topbar { 
          display: none; 
        }
        .swagger-ui .info { 
          margin: 30px 0; 
        }
        .swagger-ui .info .title { 
          font-size: 2.5rem; 
          color: #333;
        }
        .swagger-ui .opblock-tag { 
          font-size: 1.5rem; 
          border-bottom: 1px solid #eee;
          padding: 10px 0;
        }
        .swagger-ui .opblock { 
          border-radius: 8px; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          margin-bottom: 15px;
        }
        .swagger-ui .opblock .opblock-summary { 
          padding: 10px; 
        }
        .swagger-ui .scheme-container { 
          box-shadow: none; 
          margin: 0 0 20px 0;
        }
        .swagger-wrapper {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dark .swagger-ui .info .title,
        .dark .swagger-ui .opblock-tag,
        .dark .swagger-ui .opblock .opblock-summary-description,
        .dark .swagger-ui .opblock-description-wrapper p,
        .dark .swagger-ui .opblock-section-header h4,
        .dark .swagger-ui .parameter__name,
        .dark .swagger-ui .response-col_status,
        .dark .swagger-ui label,
        .dark .swagger-ui .responses-inner h4,
        .dark .swagger-ui .response-col_links,
        .dark .swagger-ui .parameters-col_description p,
        .dark .swagger-ui .tab li,
        .dark .swagger-ui table thead tr td, 
        .dark .swagger-ui table thead tr th {
          color: #eee;
        }
        .dark .swagger-ui .opblock-section-header,
        .dark .swagger-ui .opblock .opblock-section-header {
          background: transparent;
        }
        .dark .swagger-ui input,
        .dark .swagger-ui textarea {
          background: #333;
          color: #eee;
        }
        .dark .swagger-ui .model-box {
          background: #222;
        }
        .dark .swagger-ui .model {
          color: #eee;
        }
        .dark .swagger-ui .opblock-description,
        .dark .swagger-ui .opblock-external-docs-wrapper {
          background: #333;
        }
        .dark .swagger-ui {
          color: #eee;
        }
      `}</style>
      
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-4">LaunchPad API Documentation</h1>
        <p className="text-muted-foreground mb-8">
          Explore the LaunchPad API endpoints and learn how to integrate with our platform.
        </p>
      </div>
      
      {isMounted && <SwaggerUI url="/api/swagger" />}
    </div>
  )
} 