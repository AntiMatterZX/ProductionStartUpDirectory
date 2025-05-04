import Loader from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="min-h-screen">
      <Loader 
        variant="psychedelic" 
        size="lg" 
        center={true}
      />
    </div>
  )
} 