'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface DashboardShellProps {
  user: any // Supabase User type
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const getInitial = () => {
    if (user?.email) return user.email[0].toUpperCase()
    if (user?.phone) return user.phone[0].toUpperCase()
    return 'U'
  }

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'Animals', href: '/dashboard/animals', icon: '🐮' },
    { name: 'Milk', href: '/dashboard/milk-sales', icon: '🥛' },
    { name: 'Breeding', href: '/dashboard/insemination', icon: '💉' },
    { name: 'Expenses', href: '/dashboard/expenses', icon: '🧾' },
    { name: 'Vaccines', href: '/dashboard/vaccinations', icon: '🩺' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans antialiased text-gray-900 selection:bg-[#00BFA6]/20">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#1a2f5e] text-white z-50 shadow-md">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-2.5 group">
            <img 
              src="/logo.png" 
              alt="Kisan Dairy Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain bg-white/10 rounded-lg p-0.5" 
            />
            <span className="text-lg sm:text-xl font-extrabold tracking-wide text-white group-hover:text-teal-300 transition-colors">
              Kisan Dairy
            </span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00BFA6] flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-sm ring-2 ring-white/20"
              title={user?.email || user?.phone || 'User'}
            >
              {getInitial()}
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-xs sm:text-sm font-semibold text-white/90 flex items-center space-x-1 border border-white/10 active:scale-95"
              title="Logout"
            >
              {isLoggingOut ? <span>...</span> : <span>Logout</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>

      {/* Bottom Navigation Bar (Optimized for all mobile screens) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.06)] backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-around h-16 px-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[54px] sm:min-w-[70px] h-full px-1 py-1 transition-all duration-200 relative ${
                    isActive ? 'text-[#00BFA6]' : 'text-gray-400 hover:text-gray-600 active:scale-95'
                  }`}
                >
                  {/* Top Active Line Indicator */}
                  {isActive && (
                    <span className="absolute top-0 inset-x-2 h-0.5 bg-[#00BFA6] rounded-full animate-fade-in" />
                  )}
                  
                  <span className={`text-lg sm:text-xl transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] sm:text-xs tracking-tight font-bold mt-0.5 whitespace-nowrap ${isActive ? 'text-[#00BFA6]' : 'text-gray-500'}`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
