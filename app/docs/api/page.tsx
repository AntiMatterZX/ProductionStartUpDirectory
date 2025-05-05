"use client"

import { useEffect, useRef } from "react"
import SwaggerUI from 'swagger-ui-react'
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary">
          API Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore and test the LaunchPad API endpoints.
        </p>
      </div>
      
      <div className="rounded-lg border bg-card">
        <SwaggerUI url="/api/docs" />
      </div>
    </div>
  )
} 