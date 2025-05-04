"use client"

import React from "react"
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
    <div className="w-full mx-auto mb-2">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {stepArray.map((step) => {
          const isActive = step <= currentStep
          const isCurrentStep = step === currentStep
          
          return (
            <React.Fragment key={step}>
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onStepChange && step < currentStep && onStepChange(step)}
              >
                <div className="relative mb-1">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 border-2 rounded-full font-medium text-xs sm:text-sm relative z-10 transition-colors duration-300 ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isActive ? <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" /> : <span>{step}</span>}
                  </div>
                  {isCurrentStep && (
                    <div className="absolute z-0 -inset-1 bg-primary/10 rounded-full" />
                  )}
                </div>
                
                {stepTitles && stepTitles[step - 1] && (
                  <span className={`text-2xs sm:text-xs font-medium text-center ${
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
                <div className="w-full h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
                    style={{ width: isActive ? "100%" : "0%" }}
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