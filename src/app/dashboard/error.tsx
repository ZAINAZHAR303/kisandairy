'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard] Failed to load:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-4">
      <div className="text-4xl">⚠️</div>
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Could not load your data</h2>
        <p className="text-sm text-gray-600 mt-1" dir="rtl">
          ڈیٹا لوڈ نہیں ہو سکا۔ آپ کا ریکارڈ محفوظ ہے۔
        </p>
        <p className="text-xs text-gray-500 mt-2 max-w-sm">
          Your records are safe. This is usually a connection problem — please try again.
        </p>
      </div>
      <button
        onClick={() => unstable_retry()}
        className="bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-sm"
      >
        Try again / دوبارہ کوشش کریں
      </button>
    </div>
  )
}
