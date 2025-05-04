import Loader from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="min-h-[60vh]">
      <Loader 
        variant="psychedelic" 
        size="lg" 
        center={true}
        text="Loading dashboard..."
      />
    </div>
  )
}
