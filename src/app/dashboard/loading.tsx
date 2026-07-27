import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse p-2">
      {/* Top Welcome Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-xl w-64" />
        <div className="h-4 bg-gray-200 rounded-lg w-40" />
      </div>

      {/* Summary Cards Skeleton Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3 h-28">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
            </div>
            <div className="h-8 bg-gray-200 rounded-xl w-20" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 min-h-[300px]">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded-xl w-44" />
          <div className="h-8 bg-gray-200 rounded-xl w-28" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200/60 h-36 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-36" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
