import Loader from '@/components/ui/Loader'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <Loader text="Loading Kisan Dairy..." />
    </div>
  )
}
