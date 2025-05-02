"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckIcon } from "lucide-react"

interface FormStepperProps {
  currentStep: number
  totalSteps: number
  stepTitles?: string[]
  onStepChange?: (step: number) => void
}

export default function FormStepper({ 
  currentStep, 
  totalSteps, 
  stepTitles = ["Basic Info", "Detailed Info", "Media Upload", "Review"],
  onStepChange
}: FormStepperProps) {
  const stepArray = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between gap-3">
        {stepArray.map((step) => {
          const isActive = step <= currentStep
          const isCurrentStep = step === currentStep
          
          return (
            <React.Fragment key={step}>
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onStepChange && step < currentStep && onStepChange(step)}
              >
                <div className="relative mb-2">
                  <div
                    className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-medium text-sm relative z-10 transition-colors duration-300 ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isActive ? (
                        <motion.div
                          key="icon-marker-check"
                          initial={{ rotate: 180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -180, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="icon-marker-num"
                          initial={{ rotate: 180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -180, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {step}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {isActive && (
                    <div className="absolute z-0 -inset-1.5 bg-primary/10 rounded-full animate-pulse" />
                  )}
                </div>
                
                {stepTitles && stepTitles[step - 1] && (
                  <span className={`text-sm font-medium mt-1 text-center ${
                    isCurrentStep 
                      ? "text-primary" 
                      : isActive 
                        ? "text-gray-700 dark:text-gray-300" 
                        : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {stepTitles[step - 1]}
                  </span>
                )}
              </div>
              
              {step !== stepArray.length && (
                <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 relative">
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
                    animate={{ width: isActive ? "100%" : 0 }}
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