"use client"

import { motion, AnimatePresence } from "framer-motion"
import PsychedelicLoader from "./psychedelic-loader"

interface LoaderOverlayProps {
  isLoading: boolean
  message?: string
}

export default function LoaderOverlay({ isLoading, message }: LoaderOverlayProps) {
  // If not loading, don't render anything
  if (!isLoading) return null

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center">
            <PsychedelicLoader />
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-center text-lg text-white"
              >
                {message}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 