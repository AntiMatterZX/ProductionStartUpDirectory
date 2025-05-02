import { CheckIcon } from "lucide-react"
import { MotionDiv } from "@/components/ui/motion"

interface ProgressStepperProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressStepper({ currentStep, totalSteps }: ProgressStepperProps) {
  const steps = [
    { id: 1, name: "Basic Info" },
    { id: 2, name: "Detailed Info" },
    { id: 3, name: "Media Upload" },
  ]

  return (
    <MotionDiv
      className="w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="relative flex items-center">
              {step.id < currentStep ? (
                <>
                  <div className="flex items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-primary">{step.name}</span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="hidden sm:block w-full mx-5 h-0.5 bg-primary" aria-hidden="true" />
                  )}
                </>
              ) : step.id === currentStep ? (
                <>
                  <div className="flex items-center" aria-current="step">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-primary">{step.name}</span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="hidden sm:block w-full mx-5 h-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-500">{step.name}</span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="hidden sm:block w-full mx-5 h-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </MotionDiv>
  )
}
