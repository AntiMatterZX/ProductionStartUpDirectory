"use client"

import { useEffect, useState } from "react"

export function PsychedelicLoader() {
  const [rotation, setRotation] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 5) % 360)
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative w-32 h-32">
        {/* Psychedelic circles with different animations */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-pulse" 
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-500 animate-pulse"
          style={{ transform: `rotate(${-rotation * 1.5}deg)`, animationDelay: "0.2s" }}
        />
        
        <div 
          className="absolute inset-4 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 animate-pulse"
          style={{ transform: `rotate(${rotation * 2}deg)`, animationDelay: "0.3s" }}
        />
        
        <div 
          className="absolute inset-6 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-pulse"
          style={{ transform: `rotate(${-rotation * 0.8}deg)`, animationDelay: "0.4s" }}
        />
        
        <div 
          className="absolute inset-8 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 animate-pulse"
          style={{ transform: `rotate(${rotation * 1.2}deg)`, animationDelay: "0.5s" }}
        />
        
        <div 
          className="absolute inset-10 rounded-full bg-gradient-to-r from-pink-500 via-red-600 to-orange-500 animate-pulse"
          style={{ transform: `rotate(${-rotation}deg)`, animationDelay: "0.6s" }}
        />
        
        <div 
          className="absolute inset-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center"
        >
          <div className="w-4 h-4 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
} 