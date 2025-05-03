"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormStepperProps {
  currentStep: number
  totalSteps: number
  titles?: string[]
  validSteps?: Record<number, boolean>
  onStepClick?: (step: number) => void
}

export default function FormStepper({ 
  currentStep, 
  totalSteps, 
  titles = ["Basic Info", "Detailed Info", "Media Upload", "Review"],
  validSteps = {},
  onStepClick
}: FormStepperProps) {
  const stepArray = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex items-center justify-between min-w-[500px] sm:min-w-0">
        {stepArray.map((step) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const isClickable = isCompleted && validSteps[step]
          
          return (
            <React.Fragment key={step}>
              <div 
                className={cn(
                  "flex flex-col items-center justify-center",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick && onStepClick(step)}
              >
                <div className="relative mb-1 sm:mb-2">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-medium text-sm transition-colors duration-200",
                      isCompleted || isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted text-muted-foreground"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center"
                        >
                          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {step}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {isCurrent && (
                    <div className="absolute z-0 -inset-1 bg-primary/10 rounded-full animate-pulse" />
                  )}
                </div>
                
                <span className={cn(
                  "text-xs sm:text-sm font-medium text-center truncate max-w-[60px] sm:max-w-none",
                  isCurrent 
                    ? "text-primary" 
                    : isCompleted 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                )}>
                  {titles[step - 1]}
                </span>
              </div>
              
              {step !== stepArray.length && (
                <div className="w-full h-1 rounded-full bg-muted relative">
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
                    animate={{ width: isCompleted ? "100%" : 0 }}
                    transition={{ ease: "easeInOut", duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
} 