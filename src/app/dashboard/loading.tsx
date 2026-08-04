export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div>
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-shimmer mb-2"></div>
        <div className="h-4 w-32 rounded-lg bg-gray-200 animate-shimmer"></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 9 Skeleton Cards */}
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border-l-4 border-gray-200 p-3.5 sm:p-5 flex flex-col justify-between gap-4 h-24 sm:h-28">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 rounded bg-gray-200 animate-shimmer"></div>
              <div className="h-3 w-8 rounded bg-gray-200 animate-shimmer"></div>
            </div>
            <div className="h-6 sm:h-8 w-16 rounded-lg bg-gray-200 animate-shimmer"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 3 Skeleton Action Buttons */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-gray-200 animate-shimmer"></div>
        ))}
      </div>
    </div>
  )
}
