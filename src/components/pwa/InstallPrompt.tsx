'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Clear any old dismissal data so banner always shows
    localStorage.removeItem('pwa-install-dismissed')

    // Check if already installed (running in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setShowBanner(false)
    }
    setDeferredPrompt(null)
    setIsInstalling(false)
  }

  if (!showBanner || isInstalled) return null

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(34,197,94,0.15)] p-4 animate-[slideDown_0.5s_ease-out] relative overflow-hidden">
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-blue-50 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📲</span>
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-extrabold text-sm sm:text-base leading-tight">Install Kisan Dairy</p>
            <p className="text-gray-600 text-xs mt-0.5 font-medium">Works offline in the shed!</p>
            <p className="text-emerald-600 font-bold text-[10px] mt-0.5">بغیر انٹرنیٹ چلے گا — ایپ انسٹال کریں</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70 flex items-center gap-1.5"
          >
            {isInstalling ? 'Installing...' : '⬇️ Install'}
          </button>
        </div>
      </div>
    </div>
  )
}
