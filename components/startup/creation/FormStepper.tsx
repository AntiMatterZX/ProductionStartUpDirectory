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
    <div className="w-full mx-auto mb-8">
      <div className="flex items-center justify-between gap-1 sm:gap-3">
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
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-medium text-sm relative z-10 transition-colors duration-300 ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isActive ? <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <span>{step}</span>}
                  </div>
                  {isCurrentStep && (
                    <div className="absolute z-0 -inset-1.5 bg-primary/10 rounded-full" />
                  )}
                </div>
                
                {stepTitles && stepTitles[step - 1] && (
                  <span className={`text-xs sm:text-sm font-medium mt-1 text-center ${
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