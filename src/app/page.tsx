import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans flex flex-col justify-between text-gray-800">
      {/* A. Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-9 h-9">
              <Image 
                src="/logo.png" 
                alt="Kisan Dairy Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-extrabold text-[var(--color-navy)] tracking-tight group-hover:text-[var(--color-blue)] transition-colors">
              Kisan Dairy
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[var(--color-navy)] border border-[var(--color-navy)]/30 rounded-xl hover:bg-[var(--color-navy)]/5 transition-all"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="px-4.5 py-2 text-sm font-semibold text-white bg-[var(--color-blue)] hover:bg-[#007ACC] rounded-xl shadow-sm transition-all flex items-center space-x-1"
            >
              <span>Get Started Free</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* B. Hero Section */}
        <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-100 text-[var(--color-blue)] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>🇵🇰 Designed for Pakistani Dairy Farms</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-navy)] tracking-tight leading-tight max-w-4xl mx-auto">
            Pakistan ka Smartest Dairy Farm Management System
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Track milk sales, vaccinations, insemination records and farm expenses — all in one place. Built for Pakistani cow and buffalo farmers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-[var(--color-blue)] hover:bg-[#007ACC] text-white font-bold text-base rounded-2xl shadow-lg hover:scale-105 transition-all duration-200"
            >
              Get Started Free &rarr;
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white text-[var(--color-navy)] border-2 border-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white font-bold text-base rounded-2xl transition-all duration-200"
            >
              See How It Works
            </a>
          </div>
        </section>

        {/* C. Stats Bar */}
        <section className="bg-[var(--color-navy)] text-white py-8 border-y border-navy-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 flex items-center justify-center space-x-3">
              <span className="text-3xl">🐄</span>
              <div className="text-left">
                <div className="font-extrabold text-lg text-white">Built for Pakistani Farmers</div>
                <div className="text-xs text-teal-300">Cows & Buffaloes Optimized</div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center space-x-3 border-t md:border-t-0 md:border-l border-white/10">
              <span className="text-3xl">📊</span>
              <div className="text-left">
                <div className="font-extrabold text-lg text-white">4 Powerful Trackers</div>
                <div className="text-xs text-teal-300">Milk, Breeding, Health & Profits</div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center space-x-3 border-t md:border-t-0 md:border-l border-white/10">
              <span className="text-3xl">🆓</span>
              <div className="text-left">
                <div className="font-extrabold text-lg text-white">100% Free to Use</div>
                <div className="text-xs text-teal-300">No Hidden Costs or Fees</div>
              </div>
            </div>
          </div>
        </section>

        {/* D. Features Section */}
        <section id="features" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-navy)]">
              Everything You Need to Manage Your Dairy Farm
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Say goodbye to paper notebooks. Keep complete electronic records of your cattle operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1: Insemination */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-600 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-blue-50 rounded-xl">🧬</span>
                <h3 className="text-xl font-bold text-gray-900">Insemination Tracker</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track AI dates, pregnancy status, estimated calving dates and lactation numbers for every animal. Automatic gestational day counter for cows (283 days) and buffaloes (310 days).
              </p>
            </div>

            {/* Feature 2: Milk Sales */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-[var(--color-blue)] hover:shadow-md transition-all space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-teal-50 rounded-xl">🥛</span>
                <h3 className="text-xl font-bold text-gray-900">Milk Sale Tracking</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Log daily milk sales to multiple sellers, track morning and evening sessions, view monthly totals per seller. Export monthly buyer invoices in Excel and PDF formats.
              </p>
            </div>

            {/* Feature 3: Vaccination */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-green-600 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-green-50 rounded-xl">💉</span>
                <h3 className="text-xl font-bold text-gray-900">Vaccination Tracker</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Never miss a vaccine. Track FMD, HS, BQ, Brucellosis and LSD schedules with automatic due date reminders and overdue status warnings.
              </p>
            </div>

            {/* Feature 4: Expenses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-orange-600 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-orange-50 rounded-xl">💰</span>
                <h3 className="text-xl font-bold text-gray-900">Expense Tracker</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Record feed, vet, labor and utility costs. See your real monthly profit after expenses automatically with real-time financial statements.
              </p>
            </div>
          </div>
        </section>

        {/* E. How It Works Section */}
        <section id="how-it-works" className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-navy)]">
                Start Managing Your Farm in 3 Simple Steps
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">
                Get your farm digitised in less than 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-2xl bg-[var(--color-bg)]/60 border border-gray-100">
                <div className="w-12 h-12 bg-[var(--color-blue)] text-white font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900">Create Free Account</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Sign up with email, Google or your phone number. Instant setup without credit cards.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-2xl bg-[var(--color-bg)]/60 border border-gray-100">
                <div className="w-12 h-12 bg-[var(--color-navy)] text-white font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900">Add Your Animals</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your cows and buffaloes with tag numbers, breed, date of birth, and health stage.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-2xl bg-[var(--color-bg)]/60 border border-gray-100">
                <div className="w-12 h-12 bg-emerald-600 text-white font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900">Start Tracking</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Log daily milk sales, upcoming vaccines, and farm expenses. View live monthly net profit statements!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* F. CTA Banner */}
        <section className="bg-[var(--color-navy)] text-white py-16 px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Modernize Your Dairy Farm?
            </h2>
            <p className="text-teal-200 text-base sm:text-lg">
              Join Pakistani farmers already using Kisan Dairy to track their farm smarter.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-[var(--color-blue)] hover:bg-[#007ACC] text-white font-extrabold text-lg rounded-2xl shadow-xl hover:scale-105 transition-all"
              >
                Get Started Free — It&apos;s 100% Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* G. Footer */}
      <footer className="bg-[var(--color-navy-dark)] text-white border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          {/* Left: Brand */}
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-2.5">
              <Image src="/logo.png" alt="Kisan Dairy" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-white">Kisan Dairy</span>
            </div>
            <p className="text-xs text-gray-400">
              Smart dairy farm management for Pakistani farmers
            </p>
          </div>

          {/* Center Links */}
          <div className="flex justify-center space-x-6 text-sm text-gray-300 font-medium">
            <Link href="/" className="hover:text-[var(--color-blue)] transition-colors">Home</Link>
            <Link href="/login" className="hover:text-[var(--color-blue)] transition-colors">Login</Link>
            <Link href="/login" className="hover:text-[var(--color-blue)] transition-colors">Sign Up</Link>
          </div>

          {/* Right Copyright */}
          <div className="text-xs text-gray-400 text-center md:text-right">
            © 2026 Kisan Dairy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
