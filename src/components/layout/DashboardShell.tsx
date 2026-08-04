'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import OfflineIndicator from '@/components/pwa/OfflineIndicator'
import InstallPrompt from '@/components/pwa/InstallPrompt'

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
    { name: 'Home', sub: 'ہوم', href: '/dashboard', icon: '🏠' },
    { name: 'Animals', sub: 'جانور', href: '/dashboard/animals', icon: '🐮' },
    { name: 'Milk', sub: 'دودھ سیل', href: '/dashboard/milk-sales', icon: '🥛' },
    { name: 'Breeding', sub: 'ٹیکا / بیج', href: '/dashboard/insemination', icon: '💉' },
    { name: 'Expenses', sub: 'خرچہ', href: '/dashboard/expenses', icon: '🧾' },
    { name: 'Vaccines', sub: 'بیماری ٹیکہ', href: '/dashboard/vaccinations', icon: '🩺' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans antialiased text-gray-900 selection:bg-blue-500/20">
      {/* Top Header Bar (Clean White) */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white text-gray-900 z-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-2.5 group flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Kisan Dairy Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain" 
            />
            <span className="text-lg sm:text-xl font-extrabold tracking-wide text-gray-900 group-hover:text-[var(--color-blue)] transition-colors">
              Kisan Dairy
            </span>
            <OfflineIndicator />
          </Link>

          {/* Desktop Navigation Links (Centered inside Header for md+ screens) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-[var(--color-blue)] shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                  <span className={`text-[10px] font-normal ${isActive ? 'opacity-80' : 'opacity-60'}`}>({item.sub})</span>
                </Link>
              )
            })}
          </nav>

          {/* Right User Avatar & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--color-blue)] flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-sm ring-2 ring-blue-100"
              title={user?.email || user?.phone || 'User'}
            >
              {getInitial()}
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-xs sm:text-sm font-semibold text-gray-700 flex items-center space-x-1 border border-gray-200 active:scale-95"
              title="Logout"
            >
              {isLoggingOut ? <span>...</span> : <span>Logout</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Top Navigation Bar for Mobile & Tablet (Fixed below top header) */}
      <nav className="lg:hidden fixed top-14 left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-around h-14 px-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[56px] h-full px-1.5 py-1 transition-all duration-200 relative ${
                    isActive ? 'text-[var(--color-blue)]' : 'text-gray-500 hover:text-gray-700 active:scale-95'
                  }`}
                >
                  {/* Bottom Active Line Indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-2 h-0.5 bg-[var(--color-blue)] rounded-full animate-fade-in" />
                  )}
                  
                  <span className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] tracking-tight font-bold leading-tight ${isActive ? 'text-[var(--color-blue)]' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                  <span className={`text-[9px] leading-none ${isActive ? 'text-[var(--color-blue)] font-bold opacity-80' : 'text-gray-400'}`}>
                    {item.sub}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-32 lg:pt-20 pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)]">
        <InstallPrompt />
        {children}
      </main>
    </div>
  )
}
