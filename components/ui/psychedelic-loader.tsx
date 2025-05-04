"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PsychedelicLoaderProps {
  className?: string
  fullscreen?: boolean
}

export default function PsychedelicLoader({ className, fullscreen = false }: PsychedelicLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharpness
    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    let time = 0
    const centerX = canvas.width / (2 * window.devicePixelRatio)
    const centerY = canvas.height / (2 * window.devicePixelRatio)
    const maxRadius = Math.min(centerX, centerY) * 0.85

    const animate = () => {
      time += 0.01

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)

      // Draw multiple layers of spinning, morphing shapes
      for (let layer = 1; layer <= 6; layer++) {
        const layerPoints = 3 + layer * 2
        const layerRadius = maxRadius * (0.4 + layer * 0.1)
        const layerTime = time * (layer % 2 === 0 ? 1 : -1) * 0.5

        // Create a gradient for this layer
        const hue1 = (time * 50 + layer * 60) % 360
        const hue2 = (hue1 + 180) % 360
        const gradient = ctx.createLinearGradient(
          centerX - layerRadius,
          centerY - layerRadius,
          centerX + layerRadius,
          centerY + layerRadius,
        )
        gradient.addColorStop(0, `hsla(${hue1}, 100%, 50%, 0.5)`)
        gradient.addColorStop(1, `hsla(${hue2}, 100%, 50%, 0.5)`)

        // Draw the shape
        ctx.beginPath()

        for (let i = 0; i <= layerPoints; i++) {
          const angle = (Math.PI * 2 * i) / layerPoints + layerTime

          // Calculate morph radius based on sine wave
          const morphAmount = 0.2 * Math.sin(time * 2 + layer * 0.5)
          const pointRadius = layerRadius * (1 + morphAmount * Math.sin(angle * 3 + time))

          const x = centerX + pointRadius * Math.cos(angle)
          const y = centerY + pointRadius * Math.sin(angle)

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = `hsla(${hue1}, 100%, 50%, 0.8)`
        ctx.shadowBlur = 15
        ctx.strokeStyle = `hsla(${hue1}, 100%, 80%, 0.8)`
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  const containerClasses = cn(
    "relative flex items-center justify-center overflow-hidden",
    fullscreen ? "h-screen w-screen bg-black" : "h-full w-full",
    className
  )

  return (
    <div className={containerClasses}>
      {/* Psychedelic background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-600 to-blue-500 opacity-20 mix-blend-screen"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Main canvas for psychedelic patterns */}
      <div className="relative h-full w-full max-h-96 max-w-96">
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* Overlay spinning rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white opacity-30 mix-blend-overlay"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        <motion.div
          className="absolute inset-10 rounded-full border border-white opacity-20 mix-blend-overlay"
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {/* Central glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <motion.div
            className="h-24 w-24 rounded-full bg-white opacity-30 blur-xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  )
} 