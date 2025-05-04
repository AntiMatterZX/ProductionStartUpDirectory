import PsychedelicLoader from "@/components/ui/psychedelic-loader"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-64 w-64">
        <PsychedelicLoader />
      </div>
    </div>
  )
}
