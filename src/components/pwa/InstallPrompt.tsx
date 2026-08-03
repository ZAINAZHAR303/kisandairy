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
    <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 shadow-lg animate-[slideDown_0.4s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm">Install Kisan Dairy App</p>
            <p className="text-emerald-100 text-xs">Works offline in the shed — no internet needed!</p>
            <p className="text-emerald-200/80 text-[10px]">بغیر انٹرنیٹ چلے گا — ایپ انسٹال کریں</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-white text-emerald-700 font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-50 active:scale-95 transition-all shadow-md disabled:opacity-70"
          >
            {isInstalling ? 'Installing...' : '⬇️ Install'}
          </button>
        </div>
      </div>
    </div>
  )
}
