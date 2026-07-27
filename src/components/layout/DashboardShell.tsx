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
    { name: 'Milk Sales', href: '/dashboard/milk-sales', icon: '🥛' },
    { name: 'Insemination', href: '/dashboard/insemination', icon: '💉' },
    { name: 'Expenses', href: '/dashboard/expenses', icon: '🧾' },
    { name: 'Vaccines', href: '/dashboard/vaccinations', icon: '💉' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#1a2f5e] text-white z-50 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" alt="Kisan Dairy Logo" className="w-8 h-8 object-contain bg-white/10 rounded-lg p-0.5" />
          <span className="text-xl font-extrabold tracking-wide text-white">Kisan Dairy</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#00BFA6] flex items-center justify-center text-sm font-bold text-white shadow-sm">
            {getInitial()}
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-2 rounded-md hover:bg-white/10 transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
            title="Logout"
          >
            {isLoggingOut ? <span>...</span> : <span>Logout</span>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20 px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                  isActive ? 'text-[#00BFA6]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
